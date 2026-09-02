create policy "project members can delete tasks"
on public.tasks for delete
using (
  exists (
    select 1
    from public.projects p
    left join public.project_members pm
      on pm.project_id = p.id
     and pm.user_id = auth.uid()
    where p.id = tasks.project_id
      and public.is_active_workspace_member(p.workspace_id)
      and (pm.user_id is not null or public.is_workspace_admin(p.workspace_id))
  )
);
