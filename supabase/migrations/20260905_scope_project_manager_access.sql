create or replace function public.can_manage_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = p_project_id
      and (
        public.has_workspace_permission(p.workspace_id, 'workspace_delete')
        or (
          public.has_workspace_permission(p.workspace_id, 'project_manage')
          and (
            p.created_by = auth.uid()
            or exists (
              select 1
              from public.project_members pm
              where pm.project_id = p.id
                and pm.user_id = auth.uid()
            )
          )
        )
      )
  );
$$;

grant execute on function public.can_manage_project(uuid) to authenticated;

create or replace function public.delete_project(p_project_id uuid, p_project_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_name text;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  select name into v_project_name
  from public.projects
  where id = p_project_id
  for update;

  if v_project_name is null then
    raise exception 'Project not found';
  end if;
  if v_project_name <> p_project_name then
    raise exception 'Project name confirmation does not match';
  end if;
  if not public.can_manage_project(p_project_id) then
    raise exception 'Project management access is required';
  end if;

  delete from public.task_tags
  where task_id in (select id from public.tasks where project_id = p_project_id);
  delete from public.task_assignees
  where task_id in (select id from public.tasks where project_id = p_project_id);
  delete from public.task_status_history
  where task_id in (select id from public.tasks where project_id = p_project_id);
  delete from public.sprint_tasks
  where task_id in (select id from public.tasks where project_id = p_project_id);
  delete from public.tasks where project_id = p_project_id;
  delete from public.project_members where project_id = p_project_id;
  delete from public.milestones where project_id = p_project_id;
  delete from public.projects where id = p_project_id;
end;
$$;

revoke all on function public.delete_project(uuid, text) from public;
grant execute on function public.delete_project(uuid, text) to authenticated;

drop policy if exists "project managers can update projects" on public.projects;
create policy "project managers can update projects"
on public.projects for update
using (public.can_manage_project(id))
with check (public.can_manage_project(id));

drop policy if exists "project managers can manage project members" on public.project_members;
create policy "project managers can manage project members"
on public.project_members for all
using (public.can_manage_project(project_id))
with check (public.can_manage_project(project_id));

drop policy if exists "project managers can create tasks" on public.tasks;
create policy "project managers can create tasks"
on public.tasks for insert
with check (
  public.can_manage_project(tasks.project_id)
  and auth.uid() = created_by
);

drop policy if exists "project managers or assignees can update tasks" on public.tasks;
create policy "project managers or assignees can update tasks"
on public.tasks for update
using (
  public.can_manage_project(tasks.project_id)
  or exists (
    select 1
    from public.projects p
    join public.task_assignees ta
      on ta.task_id = tasks.id
     and ta.user_id = auth.uid()
    join public.workspace_members wm
      on wm.workspace_id = p.workspace_id
     and wm.user_id = auth.uid()
     and wm.status = 'active'
    where p.id = tasks.project_id
  )
)
with check (
  public.can_manage_project(tasks.project_id)
  or exists (
    select 1
    from public.projects p
    join public.task_assignees ta
      on ta.task_id = tasks.id
     and ta.user_id = auth.uid()
    join public.workspace_members wm
      on wm.workspace_id = p.workspace_id
     and wm.user_id = auth.uid()
     and wm.status = 'active'
    where p.id = tasks.project_id
  )
);

drop policy if exists "project managers can delete tasks" on public.tasks;
create policy "project managers can delete tasks"
on public.tasks for delete
using (public.can_manage_project(tasks.project_id));

drop policy if exists "project managers can manage task assignees" on public.task_assignees;
create policy "project managers can manage task assignees"
on public.task_assignees for all
using (
  public.can_manage_project(
    (select t.project_id from public.tasks t where t.id = task_assignees.task_id)
  )
)
with check (
  public.can_manage_project(
    (select t.project_id from public.tasks t where t.id = task_assignees.task_id)
  )
);

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

  if public.can_manage_project(old.project_id) then
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
