drop function if exists public.create_project(uuid, text, text, text, date, date, uuid, uuid[], uuid);

create or replace function public.create_project(
  p_workspace_id uuid,
  p_name text,
  p_slug text,
  p_description text,
  p_start_date date,
  p_due_date date,
  p_owner_id uuid,
  p_member_ids uuid[],
  p_created_by uuid
)
returns public.projects
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_project public.projects;
begin
  if v_user_id is null or not public.is_workspace_admin(p_workspace_id) then
    raise exception 'Workspace administrator access is required';
  end if;

  if p_created_by is distinct from v_user_id then
    raise exception 'Project creator must be the authenticated user';
  end if;

  insert into public.projects
    (workspace_id, slug, name, description, status, owner_id, start_date, due_date, created_by)
  values
    (p_workspace_id, p_slug, p_name, p_description, 'planning', p_owner_id, p_start_date, p_due_date, v_user_id)
  returning * into v_project;

  insert into public.project_members (project_id, user_id, project_role, added_by)
  select v_project.id, member_id, case when member_id = p_owner_id then 'Project owner' else 'Project team' end, v_user_id
  from unnest(array_append(coalesce(p_member_ids, '{}'::uuid[]), p_owner_id)) as member_id
  on conflict (project_id, user_id) do nothing;

  return v_project;
end;
$$;

revoke all on function public.create_project(uuid, text, text, text, date, date, uuid, uuid[], uuid) from public;
grant execute on function public.create_project(uuid, text, text, text, date, date, uuid, uuid[], uuid) to authenticated;
