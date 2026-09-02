-- Add task intervals. Existing tasks inherit their project's start date.
alter table public.tasks
  add column if not exists start_date date;

update public.tasks t
set start_date = p.start_date
from public.projects p
where p.id = t.project_id
  and t.start_date is null;

alter table public.tasks
  alter column start_date set not null;

alter table public.tasks
  drop constraint if exists tasks_dates_valid,
  add constraint tasks_dates_valid check (due_date is null or due_date >= start_date);

create index if not exists tasks_project_start_date_idx
  on public.tasks (project_id, start_date)
  where deleted_at is null;
