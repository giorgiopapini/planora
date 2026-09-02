alter table public.workspace_roles
  add column if not exists permission_key text not null default 'normal_user';

-- Replace the live legacy trigger before any role is inserted or normalized.
-- The old function rejected every role outside its original fixed list.
create or replace function public.prevent_protected_role_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('app.role_migration', true) = 'true' then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if current_setting('app.workspace_deletion_id', true) = old.workspace_id::text then
      return old;
    end if;
    if old.role_key in ('owner', 'unknown') then
      raise exception 'Owner and Unknown roles cannot be deleted';
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE'
    and (old.role_key in ('owner', 'unknown')
      or new.role_key in ('owner', 'unknown')
      or new.role_key is distinct from old.role_key) then
    raise exception 'Owner and Unknown roles cannot be modified';
  end if;

  if tg_op = 'INSERT'
    and new.role_key in ('owner', 'unknown')
    and not new.is_system then
    raise exception 'Owner and Unknown roles must be system roles';
  end if;

  return new;
end;
$$;

create or replace function public.normalize_workspace_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role_key = 'owner' then
    new.name := 'Owner';
    new.is_system := true;
    new.permission_key := 'owner_like';
  elsif new.role_key = 'unknown' then
    new.name := 'Unknown';
    new.is_system := true;
    new.permission_key := 'normal_user';
  else
    new.is_system := false;
    if new.permission_key is null or new.permission_key not in ('owner_like', 'project_manager', 'normal_user') then
      new.permission_key := case
        when new.role_key = 'admin' then 'owner_like'
        when new.role_key = 'project_manager' then 'project_manager'
        else 'normal_user'
      end;
    end if;
  end if;
  return new;
end;
$$;

-- Remove protection triggers from earlier schema versions. They are located by
-- function name so this also repairs databases where the trigger was renamed.
do $$
declare
  trigger_name text;
begin
  for trigger_name in
    select t.tgname
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
    where t.tgrelid = 'public.workspace_roles'::regclass
      and not t.tgisinternal
      and p.proname in (
        'prevent_protected_role_mutation',
        'prevent_system_workspace_role_change',
        'prevent_system_role_delete'
      )
  loop
    execute format('drop trigger if exists %I on public.workspace_roles', trigger_name);
  end loop;
end;
$$;

drop trigger if exists aa_normalize_workspace_role on public.workspace_roles;
create trigger aa_normalize_workspace_role
before insert or update on public.workspace_roles
for each row execute function public.normalize_workspace_role();

drop trigger if exists prevent_protected_workspace_role_mutation on public.workspace_roles;
create trigger prevent_protected_workspace_role_mutation
before update or delete on public.workspace_roles
for each row execute function public.prevent_protected_role_mutation();

-- Bootstrap Unknown and normalize legacy roles while migration bypass is active.
select set_config('app.role_migration', 'true', false);

insert into public.workspace_roles (workspace_id, role_key, name, permission_key, is_system)
select w.id, 'unknown', 'Unknown', 'normal_user', true
from public.workspaces w
where not exists (
  select 1
  from public.workspace_roles wr
  where wr.workspace_id = w.id
    and wr.role_key = 'unknown'
);

update public.workspace_roles
set name = case when role_key = 'owner' then 'Owner' when role_key = 'unknown' then 'Unknown' else name end,
    permission_key = case
      when role_key = 'owner' then 'owner_like'
      when role_key = 'admin' then 'owner_like'
      when role_key = 'project_manager' then 'project_manager'
      else 'normal_user'
    end,
    is_system = role_key in ('owner', 'unknown'),
    archived_at = case when role_key in ('owner', 'unknown') then null else archived_at end;

alter table public.workspace_roles
  drop constraint if exists workspace_roles_permission_key_check;

alter table public.workspace_roles
  add constraint workspace_roles_permission_key_check
  check (permission_key in ('owner_like', 'project_manager', 'normal_user'));

select set_config('app.role_migration', 'false', false);

create or replace function public.is_workspace_owner(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspaces w
    where w.id = p_workspace_id
      and w.owner_id = auth.uid()
  );
$$;

create or replace function public.has_workspace_permission(p_workspace_id uuid, p_permission_key text)
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
        or (p_permission_key = 'member_manage' and wr.permission_key = 'owner_like')
        or (p_permission_key = 'project_manage' and wr.permission_key in ('owner_like', 'project_manager'))
        or (p_permission_key = 'task_manage' and wr.permission_key in ('owner_like', 'project_manager'))
        or (p_permission_key = 'task_status' and wr.permission_key in ('owner_like', 'project_manager', 'normal_user'))
      )
  );
$$;

create or replace function public.is_workspace_owner_like(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_workspace_permission(p_workspace_id, 'workspace_delete');
$$;

create or replace function public.can_manage_members(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_workspace_permission(p_workspace_id, 'member_manage');
$$;

create or replace function public.can_manage_projects(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_workspace_permission(p_workspace_id, 'project_manage');
$$;

create or replace function public.can_manage_tasks(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_workspace_permission(p_workspace_id, 'task_manage');
$$;

create or replace function public.is_workspace_admin(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_manage_projects(p_workspace_id);
$$;

grant execute on function public.is_workspace_owner(uuid) to authenticated;
grant execute on function public.has_workspace_permission(uuid, text) to authenticated;
grant execute on function public.is_workspace_owner_like(uuid) to authenticated;
grant execute on function public.can_manage_members(uuid) to authenticated;
grant execute on function public.can_manage_projects(uuid) to authenticated;
grant execute on function public.can_manage_tasks(uuid) to authenticated;
grant execute on function public.is_workspace_admin(uuid) to authenticated;

create or replace function public.delete_workspace_role(p_workspace_id uuid, p_role_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.workspace_roles;
  v_unknown_role_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;
  if not public.is_workspace_owner(p_workspace_id) then
    raise exception 'Only the workspace owner can manage roles';
  end if;

  select * into v_role
  from public.workspace_roles
  where id = p_role_id
    and workspace_id = p_workspace_id
  for update;
  if not found then
    raise exception 'Workspace role not found';
  end if;
  if v_role.role_key in ('owner', 'unknown') then
    raise exception 'Owner and Unknown roles cannot be deleted';
  end if;

  select id into v_unknown_role_id
  from public.workspace_roles
  where workspace_id = p_workspace_id
    and role_key = 'unknown'
    and archived_at is null;
  if v_unknown_role_id is null then
    raise exception 'The Unknown role is not configured for this workspace';
  end if;

  update public.workspace_members
  set role_id = v_unknown_role_id
  where workspace_id = p_workspace_id
    and role_id = p_role_id;

  update public.workspace_invitations
  set role_id = v_unknown_role_id
  where workspace_id = p_workspace_id
    and role_id = p_role_id;

  delete from public.workspace_roles
  where id = p_role_id
    and workspace_id = p_workspace_id;
end;
$$;

revoke all on function public.delete_workspace_role(uuid, uuid) from public;
grant execute on function public.delete_workspace_role(uuid, uuid) to authenticated;

create or replace function public.delete_workspace(p_workspace_id uuid, p_workspace_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_name text;
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;
  select name into v_workspace_name from public.workspaces where id = p_workspace_id for update;
  if v_workspace_name is null then raise exception 'Workspace not found'; end if;
  if v_workspace_name <> p_workspace_name then raise exception 'Workspace name confirmation does not match'; end if;
  if not public.is_workspace_owner_like(p_workspace_id) then raise exception 'Owner-like workspace access is required'; end if;

  perform set_config('app.workspace_deletion_id', p_workspace_id::text, true);
  delete from public.task_tags where task_id in (select t.id from public.tasks t join public.projects p on p.id=t.project_id where p.workspace_id=p_workspace_id);
  delete from public.task_assignees where task_id in (select t.id from public.tasks t join public.projects p on p.id=p.project_id where p.workspace_id=p_workspace_id);
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

revoke all on function public.delete_workspace(uuid, text) from public;
grant execute on function public.delete_workspace(uuid, text) to authenticated;

create or replace function public.delete_project(p_project_id uuid, p_project_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_name text;
  v_workspace_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;
  select name, workspace_id into v_project_name, v_workspace_id from public.projects where id = p_project_id for update;
  if v_project_name is null then raise exception 'Project not found'; end if;
  if v_project_name <> p_project_name then raise exception 'Project name confirmation does not match'; end if;
  if not public.can_manage_projects(v_workspace_id) then raise exception 'Project management access is required'; end if;

  delete from public.task_tags where task_id in (select id from public.tasks where project_id = p_project_id);
  delete from public.task_assignees where task_id in (select id from public.tasks where project_id = p_project_id);
  delete from public.task_status_history where task_id in (select id from public.tasks where project_id = p_project_id);
  delete from public.sprint_tasks where task_id in (select st.task_id from public.sprint_tasks st join public.tasks t on t.id=st.task_id where t.project_id=p_project_id);
  delete from public.tasks where project_id = p_project_id;
  delete from public.project_members where project_id = p_project_id;
  delete from public.milestones where project_id = p_project_id;
  delete from public.projects where id = p_project_id;
end;
$$;

revoke all on function public.delete_project(uuid, text) from public;
grant execute on function public.delete_project(uuid, text) to authenticated;

-- Remove older broad policies before installing permission-specific policies.
drop policy if exists "workspace admins can update workspaces" on public.workspaces;
drop policy if exists "workspace admins can manage workspace roles" on public.workspace_roles;
drop policy if exists "workspace admins can manage workspace members" on public.workspace_members;
drop policy if exists "workspace admins can manage invitations" on public.workspace_invitations;
drop policy if exists "workspace admins can create projects" on public.projects;
drop policy if exists "project members or workspace admins can update projects" on public.projects;
drop policy if exists "workspace admins can manage project members" on public.project_members;
drop policy if exists "project members can create tasks" on public.tasks;
drop policy if exists "project members can update tasks" on public.tasks;
drop policy if exists "project members can delete tasks" on public.tasks;
drop policy if exists "project members can manage task assignees" on public.task_assignees;

drop policy if exists "workspace owner-like roles can update workspaces" on public.workspaces;
create policy "workspace owner-like roles can update workspaces"
on public.workspaces for update
using (public.is_workspace_owner_like(id))
with check (public.is_workspace_owner_like(id));

drop policy if exists "workspace owners can manage workspace roles" on public.workspace_roles;
create policy "workspace owners can manage workspace roles"
on public.workspace_roles for all
using (public.is_workspace_owner(workspace_id))
with check (public.is_workspace_owner(workspace_id));

drop policy if exists "workspace owner-like roles can manage workspace members" on public.workspace_members;
create policy "workspace owner-like roles can manage workspace members"
on public.workspace_members for all
using (public.can_manage_members(workspace_id))
with check (public.can_manage_members(workspace_id));

drop policy if exists "workspace owner-like roles can manage invitations" on public.workspace_invitations;
create policy "workspace owner-like roles can manage invitations"
on public.workspace_invitations for all
using (public.can_manage_members(workspace_id))
with check (public.can_manage_members(workspace_id));

drop policy if exists "project managers can create projects" on public.projects;
create policy "project managers can create projects"
on public.projects for insert
with check (public.can_manage_projects(workspace_id) and auth.uid() = created_by);

drop policy if exists "project managers can update projects" on public.projects;
create policy "project managers can update projects"
on public.projects for update
using (public.can_manage_projects(workspace_id))
with check (public.can_manage_projects(workspace_id));

drop policy if exists "workspace admins can manage project members" on public.project_members;
create policy "project managers can manage project members"
on public.project_members for all
using (exists (select 1 from public.projects p where p.id = project_members.project_id and public.can_manage_projects(p.workspace_id)))
with check (exists (select 1 from public.projects p where p.id = project_members.project_id and public.can_manage_projects(p.workspace_id)));

create policy "project managers can create tasks"
on public.tasks for insert
with check (
  public.can_manage_tasks((select p.workspace_id from public.projects p where p.id = tasks.project_id))
  and auth.uid() = created_by
);

create policy "project managers or assignees can update tasks"
on public.tasks for update
using (
  public.can_manage_tasks((select p.workspace_id from public.projects p where p.id = tasks.project_id))
  or exists (
    select 1
    from public.projects p
    join public.task_assignees ta on ta.task_id = tasks.id and ta.user_id = auth.uid()
    join public.workspace_members wm on wm.workspace_id = p.workspace_id and wm.user_id = auth.uid() and wm.status = 'active'
    where p.id = tasks.project_id
  )
)
with check (
  public.can_manage_tasks((select p.workspace_id from public.projects p where p.id = tasks.project_id))
  or exists (
    select 1
    from public.projects p
    join public.task_assignees ta on ta.task_id = tasks.id and ta.user_id = auth.uid()
    join public.workspace_members wm on wm.workspace_id = p.workspace_id and wm.user_id = auth.uid() and wm.status = 'active'
    where p.id = tasks.project_id
  )
);

create policy "project managers can delete tasks"
on public.tasks for delete
using (public.can_manage_tasks((select p.workspace_id from public.projects p where p.id = tasks.project_id)));

create policy "project managers can manage task assignees"
on public.task_assignees for all
using (public.can_manage_tasks((select p.workspace_id from public.tasks t join public.projects p on p.id = t.project_id where t.id = task_assignees.task_id)))
with check (public.can_manage_tasks((select p.workspace_id from public.tasks t join public.projects p on p.id = t.project_id where t.id = task_assignees.task_id)));

create or replace function public.prevent_normal_user_task_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_id uuid;
begin
  select p.workspace_id into v_workspace_id
  from public.projects p
  where p.id = old.project_id;

  if public.can_manage_tasks(v_workspace_id) then
    return new;
  end if;

  if not exists (
    select 1
    from public.task_assignees ta
    where ta.task_id = old.id
      and ta.user_id = auth.uid()
  ) then
    raise exception 'Only an assigned user can update this task';
  end if;

  if new.project_id is distinct from old.project_id
    or new.parent_task_id is distinct from old.parent_task_id
    or new.title is distinct from old.title
    or new.description is distinct from old.description
    or new.priority is distinct from old.priority
    or new.start_date is distinct from old.start_date
    or new.due_date is distinct from old.due_date
    or new.position is distinct from old.position
    or new.estimate_minutes is distinct from old.estimate_minutes
    or new.created_by is distinct from old.created_by
    or new.deleted_at is distinct from old.deleted_at
    or new.metadata is distinct from old.metadata then
    raise exception 'Normal users can only update the status of tasks assigned to them';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_normal_user_task_mutation on public.tasks;
create trigger prevent_normal_user_task_mutation
before update on public.tasks
for each row execute function public.prevent_normal_user_task_mutation();
