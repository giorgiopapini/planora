-- Replace the legacy role guard before changing any workspace_roles rows.
-- Custom workspace roles are valid; only Owner and Unknown are protected.
create or replace function public.prevent_protected_role_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if current_setting('app.workspace_deletion_id', true) = old.workspace_id::text then
      return old;
    end if;
    if old.is_system or old.role_key in ('owner', 'unknown') then
      raise exception 'System workspace roles cannot be deleted';
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' then
    -- Permit one-time conversion of a legacy custom unknown row during bootstrap.
    if old.role_key = 'unknown' and not old.is_system
      and new.role_key = 'unknown' and new.is_system and new.name = 'Unknown' then
      return new;
    end if;

    if old.is_system or old.role_key in ('owner', 'unknown')
      or new.is_system or new.role_key in ('owner', 'unknown') then
      raise exception 'Owner and Unknown roles cannot be modified';
    end if;
  end if;

  if tg_op = 'INSERT'
    and new.role_key in ('owner', 'unknown')
    and not new.is_system then
    raise exception 'Owner and Unknown roles must be system roles';
  end if;

  return new;
end;
$$;

-- Ensure every workspace has an active, system Unknown role.
insert into public.workspace_roles (workspace_id, role_key, name, is_system)
select w.id, 'unknown', 'Unknown', true
from public.workspaces w
where not exists (
  select 1
  from public.workspace_roles wr
  where wr.workspace_id = w.id
    and wr.role_key = 'unknown'
);

update public.workspace_roles
set name = 'Unknown',
    is_system = true,
    archived_at = null
where role_key = 'unknown'
  and (name is distinct from 'Unknown' or not is_system or archived_at is not null);

create or replace function public.prevent_system_workspace_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if current_setting('app.workspace_deletion_id', true) = old.workspace_id::text then
      return old;
    end if;
    if old.is_system or old.role_key in ('owner', 'unknown') then
      raise exception 'System workspace roles cannot be deleted';
    end if;
    return old;
  end if;

  if old.is_system or old.role_key in ('owner', 'unknown')
    or new.is_system or new.role_key in ('owner', 'unknown') then
    raise exception 'Owner and Unknown roles cannot be modified';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_system_workspace_role on public.workspace_roles;
create trigger protect_system_workspace_role
before update or delete on public.workspace_roles
for each row execute function public.prevent_system_workspace_role_change();

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

  if not public.is_workspace_admin(p_workspace_id) then
    raise exception 'Only a workspace administrator can delete roles';
  end if;

  select * into v_role
  from public.workspace_roles
  where id = p_role_id
    and workspace_id = p_workspace_id
  for update;

  if not found then
    raise exception 'Workspace role not found';
  end if;

  if v_role.is_system or v_role.role_key in ('owner', 'unknown') then
    raise exception 'Owner and Unknown roles cannot be deleted';
  end if;

  select id into v_unknown_role_id
  from public.workspace_roles
  where workspace_id = p_workspace_id
    and role_key = 'unknown'
    and is_system
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
