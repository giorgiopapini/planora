create or replace function public.can_manage_workspace_member(
  p_workspace_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_workspace_owner(p_workspace_id)
    or exists (
      select 1
      from public.workspace_members actor
      join public.workspace_roles actor_role
        on actor_role.id = actor.role_id
       and actor_role.workspace_id = actor.workspace_id
      join public.workspace_members target
        on target.workspace_id = actor.workspace_id
       and target.user_id = p_user_id
      join public.workspace_roles target_role
        on target_role.id = target.role_id
       and target_role.workspace_id = target.workspace_id
      where actor.workspace_id = p_workspace_id
        and actor.user_id = auth.uid()
        and actor.status = 'active'
        and target.status = 'active'
        and actor_role.permission_key = 'project_manager'
        and target_role.permission_key = 'normal_user'
    );
$$;

create or replace function public.can_assign_workspace_role(
  p_workspace_id uuid,
  p_role_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_workspace_owner(p_workspace_id)
    or (
      exists (
        select 1
        from public.workspace_members actor
        join public.workspace_roles actor_role
          on actor_role.id = actor.role_id
         and actor_role.workspace_id = actor.workspace_id
        where actor.workspace_id = p_workspace_id
          and actor.user_id = auth.uid()
          and actor.status = 'active'
          and actor_role.permission_key = 'project_manager'
      )
      and exists (
        select 1
        from public.workspace_roles target_role
        where target_role.workspace_id = p_workspace_id
          and target_role.id = p_role_id
          and target_role.archived_at is null
          and target_role.permission_key = 'normal_user'
      )
    );
$$;

grant execute on function public.can_manage_workspace_member(uuid, uuid) to authenticated;
grant execute on function public.can_assign_workspace_role(uuid, uuid) to authenticated;

create or replace function public.has_workspace_permission(
  p_workspace_id uuid,
  p_permission_key text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspaces w
    where w.id = p_workspace_id
      and w.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.workspace_members wm
    join public.workspace_roles wr
      on wr.id = wm.role_id
     and wr.workspace_id = wm.workspace_id
    where wm.workspace_id = p_workspace_id
      and wm.user_id = auth.uid()
      and wm.status = 'active'
      and wr.archived_at is null
      and (
        (p_permission_key = 'workspace_delete' and wr.permission_key = 'owner_like')
        or (p_permission_key = 'member_manage' and wr.permission_key in ('owner_like', 'project_manager'))
        or (p_permission_key = 'project_manage' and wr.permission_key in ('owner_like', 'project_manager'))
        or (p_permission_key = 'task_manage' and wr.permission_key in ('owner_like', 'project_manager'))
        or (p_permission_key = 'task_status' and wr.permission_key in ('owner_like', 'project_manager', 'normal_user'))
      )
  );
$$;

drop policy if exists "workspace owner-like roles can manage workspace members" on public.workspace_members;
create policy "workspace managers can read workspace members"
on public.workspace_members for select
using (public.has_workspace_permission(workspace_id, 'member_manage') or public.is_active_workspace_member(workspace_id));

create policy "workspace owners can insert workspace members"
on public.workspace_members for insert
with check (public.is_workspace_owner(workspace_id));

create policy "workspace managers can update workspace members"
on public.workspace_members for update
using (
  public.is_workspace_owner(workspace_id)
  or public.can_manage_workspace_member(workspace_id, user_id)
)
with check (
  public.is_workspace_owner(workspace_id)
  or (
    public.can_manage_workspace_member(workspace_id, user_id)
    and exists (
      select 1
      from public.workspace_roles wr
      where wr.id = role_id
        and wr.workspace_id = workspace_members.workspace_id
        and wr.permission_key = 'normal_user'
        and wr.archived_at is null
    )
  )
);

create policy "workspace managers can remove workspace members"
on public.workspace_members for delete
using (
  public.is_workspace_owner(workspace_id)
  or public.can_manage_workspace_member(workspace_id, user_id)
);

drop policy if exists "workspace owner-like roles can manage invitations" on public.workspace_invitations;
create policy "workspace managers can read invitations"
on public.workspace_invitations for select
using (public.has_workspace_permission(workspace_id, 'member_manage'));

create policy "workspace managers can create invitations"
on public.workspace_invitations for insert
with check (
  public.is_workspace_owner(workspace_id)
  or public.can_assign_workspace_role(workspace_id, role_id)
);

create policy "workspace managers can remove invitations"
on public.workspace_invitations for delete
using (
  public.is_workspace_owner(workspace_id)
  or public.can_assign_workspace_role(workspace_id, role_id)
);
