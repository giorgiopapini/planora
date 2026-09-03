create or replace function public.prevent_system_role_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.is_system and current_setting('app.workspace_deletion_id', true) is distinct from old.workspace_id::text then
    raise exception 'System workspace roles cannot be deleted';
  end if;
  return old;
end;
$$;

create or replace function public.prevent_system_status_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.is_system and current_setting('app.workspace_deletion_id', true) is distinct from old.workspace_id::text then
    raise exception 'System workflow statuses cannot be deleted';
  end if;
  return old;
end;
$$;

-- Single home for workspace deletion. The permission check relies on
-- public.is_workspace_owner_like(), which is created in a later migration and
-- resolved at runtime.
create or replace function public.delete_workspace(p_workspace_id uuid, p_workspace_name text)
returns void language plpgsql security definer set search_path = public as $$
declare v_workspace_name text;
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;
  select name into v_workspace_name from public.workspaces where id = p_workspace_id for update;
  if v_workspace_name is null then raise exception 'Workspace not found'; end if;
  if v_workspace_name <> p_workspace_name then raise exception 'Workspace name confirmation does not match'; end if;
  if not public.is_workspace_owner_like(p_workspace_id) then raise exception 'Owner-like workspace access is required'; end if;

  perform set_config('app.workspace_deletion_id', p_workspace_id::text, true);
  delete from public.task_tags where task_id in (select t.id from public.tasks t join public.projects p on p.id=t.project_id where p.workspace_id=p_workspace_id);
  delete from public.task_assignees where task_id in (select t.id from public.tasks t join public.projects p on p.id=t.project_id where p.workspace_id=p_workspace_id);
  delete from public.task_status_history where task_id in (select t.id from public.tasks t join public.projects p on p.id=t.project_id where p.workspace_id=p_workspace_id);
  delete from public.sprint_tasks where task_id in (select st.task_id from public.sprint_tasks st join public.tasks t on t.id=st.task_id join public.projects p on p.id=t.project_id where p.workspace_id=p_workspace_id);
  delete from public.tasks where project_id in (select id from public.projects where workspace_id=p_workspace_id);
  delete from public.project_members where project_id in (select id from public.projects where workspace_id=p_workspace_id);
  delete from public.milestones where project_id in (select id from public.projects where workspace_id=p_workspace_id);
  delete from public.projects where workspace_id=p_workspace_id;
  delete from public.activity_events where workspace_id=p_workspace_id;
  delete from public.member_capacity where workspace_id=p_workspace_id;
  delete from public.sprints where workspace_id=p_workspace_id;
  delete from public.tags where workspace_id=p_workspace_id;
  delete from public.workspace_invitations where workspace_id=p_workspace_id;
  delete from public.workspace_members where workspace_id=p_workspace_id;
  delete from public.workflow_statuses where workspace_id=p_workspace_id;
  delete from public.workspace_roles where workspace_id=p_workspace_id;
  delete from public.workspaces where id=p_workspace_id;
end;
$$;

revoke all on function public.delete_workspace(uuid,text) from public;
grant execute on function public.delete_workspace(uuid,text) to authenticated;