create or replace function public.delete_project(p_project_id uuid, p_project_name text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_project_name text;
  v_workspace_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;
  select name, workspace_id into v_project_name, v_workspace_id from public.projects where id = p_project_id for update;
  if v_project_name is null then raise exception 'Project not found'; end if;
  if v_project_name <> p_project_name then raise exception 'Project name confirmation does not match'; end if;
  if not public.is_workspace_admin(v_workspace_id) then raise exception 'Only a workspace administrator can delete this project'; end if;

  delete from public.task_tags where task_id in (select id from public.tasks where project_id = p_project_id);
  delete from public.task_assignees where task_id in (select id from public.tasks where project_id = p_project_id);
  delete from public.task_status_history where task_id in (select id from public.tasks where project_id = p_project_id);
  delete from public.sprint_tasks where task_id in (select id from public.tasks where project_id = p_project_id);
  delete from public.tasks where project_id = p_project_id;
  delete from public.project_members where project_id = p_project_id;
  delete from public.milestones where project_id = p_project_id;
  delete from public.projects where id = p_project_id;
end;
$$;

revoke all on function public.delete_project(uuid,text) from public;
grant execute on function public.delete_project(uuid,text) to authenticated;
