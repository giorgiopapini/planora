-- Single home for account deletion.
--
-- Workspace handling when the owner deletes their account:
--   - workspace with no other active members  -> deleted entirely
--   - workspace with other active members     -> ownership (and the Owner
--     role) is transferred to the active member with the highest privileges
--     (owner_like > project_manager > normal_user; earliest joined_at wins
--     ties), so the surviving team keeps the workspace
--   - workspaces the user merely belongs to  -> the user is removed
--
-- Projects the user owns/created in surviving workspaces are handed to the
-- workspace owner; milestones and sprints they created follow the workspace
-- owner. Tasks they created are removed (their created_by column is NOT NULL
-- with a restrict FK, and the normal-user task trigger forbids reassigning it).
-- Finally the auth user is deleted; public.profiles cascades from auth.users.
create or replace function public.delete_user()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := auth.uid();
  v_workspace_id uuid;
  v_new_owner uuid;
begin
  if v_user_id is null then raise exception 'Authentication is required'; end if;

  -- Workspaces owned by the deleted user.
  for v_workspace_id in
    select id from public.workspaces where owner_id = v_user_id
  loop
    select wm.user_id into v_new_owner
    from public.workspace_members wm
    left join public.workspace_roles wr
      on wr.id = wm.role_id
     and wr.workspace_id = wm.workspace_id
    where wm.workspace_id = v_workspace_id
      and wm.user_id <> v_user_id
      and wm.status = 'active'
      and wr.archived_at is null
    order by
      case wr.permission_key
        when 'owner_like' then 3
        when 'project_manager' then 2
        else 1
      end desc,
      wm.joined_at asc nulls last,
      wm.user_id asc
    limit 1;

    -- The deleted user was the only active member: delete the workspace.
    -- The app.workspace_deletion_id setting lets the workspace-owner and
    -- system role/status delete guards know this is an intentional workspace
    -- deletion (it also bypasses the owner-membership trigger below).
    perform set_config('app.workspace_deletion_id', v_workspace_id::text, true);

    if v_new_owner is null then
      delete from public.task_tags where task_id in (select t.id from public.tasks t join public.projects p on p.id=t.project_id where p.workspace_id=v_workspace_id);
      delete from public.task_assignees where task_id in (select t.id from public.tasks t join public.projects p on p.id=t.project_id where p.workspace_id=v_workspace_id);
      delete from public.task_status_history where task_id in (select t.id from public.tasks t join public.projects p on p.id=t.project_id where p.workspace_id=v_workspace_id);
      delete from public.sprint_tasks where task_id in (select st.task_id from public.sprint_tasks st join public.tasks t on t.id=st.task_id join public.projects p on p.id=t.project_id where p.workspace_id=v_workspace_id);
      delete from public.tasks where project_id in (select id from public.projects where workspace_id=v_workspace_id);
      delete from public.project_members where project_id in (select id from public.projects where workspace_id=v_workspace_id);
      delete from public.milestones where project_id in (select id from public.projects where workspace_id=v_workspace_id);
      delete from public.projects where workspace_id=v_workspace_id;
      delete from public.activity_events where workspace_id=v_workspace_id;
      delete from public.member_capacity where workspace_id=v_workspace_id;
      delete from public.sprints where workspace_id=v_workspace_id;
      delete from public.tags where workspace_id=v_workspace_id;
      delete from public.workspace_invitations where workspace_id=v_workspace_id;
      delete from public.workspace_members where workspace_id=v_workspace_id;
      delete from public.workflow_statuses where workspace_id=v_workspace_id;
      delete from public.workspace_roles where workspace_id=v_workspace_id;
      delete from public.workspaces where id=v_workspace_id;
    else
      -- Transfer ownership to the most privileged remaining member: promote
      -- them to the workspace Owner role, then remove the deleted owner.
      update public.workspaces
      set owner_id = v_new_owner,
          created_by = v_new_owner
      where id = v_workspace_id;

      update public.workspace_members wm
      set role_id = (
        select id
        from public.workspace_roles
        where workspace_id = v_workspace_id
          and role_key = 'owner'
          and archived_at is null
        limit 1
      )
      where wm.workspace_id = v_workspace_id
        and wm.user_id = v_new_owner;

      delete from public.workspace_members
      where workspace_id = v_workspace_id
        and user_id = v_user_id;
    end if;
  end loop;

  -- Projects the user owned in surviving workspaces: make the workspace owner
  -- a project member first (the projects trigger requires the owner to be a
  -- member), then hand ownership over.
  insert into public.project_members (project_id, user_id, project_role, added_by)
  select p.id, w.owner_id, 'Project owner', null
  from public.projects p
  join public.workspaces w on w.id = p.workspace_id
  where p.owner_id = v_user_id
  on conflict (project_id, user_id) do nothing;

  update public.projects p
  set owner_id = case when p.owner_id = v_user_id then w.owner_id else p.owner_id end,
      created_by = w.owner_id
  from public.workspaces w
  where w.id = p.workspace_id
    and (p.owner_id = v_user_id or p.created_by = v_user_id);

  -- Tasks created by the user cannot be reassigned (NOT NULL restrict FK and
  -- the normal-user task trigger), so they are removed with the account.
  delete from public.tasks where created_by = v_user_id;

  -- Milestones and sprints created by the user follow the workspace owner.
  update public.milestones m
  set created_by = w.owner_id
  from public.projects p
  join public.workspaces w on w.id = p.workspace_id
  where m.project_id = p.id
    and m.created_by = v_user_id;

  update public.sprints s
  set created_by = w.owner_id
  from public.workspaces w
  where s.workspace_id = w.id
    and s.created_by = v_user_id;

  -- Remaining profile references.
  delete from public.project_members where user_id = v_user_id;
  delete from public.task_assignees where user_id = v_user_id;
  delete from public.member_capacity where user_id = v_user_id;
  delete from public.workspace_members where user_id = v_user_id;
  delete from public.workspace_invitations where invited_by = v_user_id;

  -- public.profiles.id references auth.users(id) on delete cascade.
  delete from auth.users where id = v_user_id;
end;
$$;

revoke all on function public.delete_user() from public;
grant execute on function public.delete_user() to authenticated;