create or replace function public.prevent_workspace_owner_membership_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_id uuid;
  v_owner_id uuid;
  v_role_key text;
begin
  if tg_op = 'DELETE' then
    v_workspace_id := old.workspace_id;
  else
    v_workspace_id := new.workspace_id;
  end if;

  if current_setting('app.workspace_deletion_id', true) = v_workspace_id::text then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  select owner_id into v_owner_id
  from public.workspaces
  where id = v_workspace_id;

  if tg_op = 'DELETE' then
    if old.user_id = v_owner_id then
      raise exception 'The workspace owner cannot be removed';
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' and (old.user_id = v_owner_id or new.user_id = v_owner_id) then
    raise exception 'The workspace owner cannot be modified';
  end if;

  select role_key into v_role_key
  from public.workspace_roles
  where id = new.role_id
    and workspace_id = new.workspace_id;

  if v_role_key = 'owner' and new.user_id is distinct from v_owner_id then
    raise exception 'The Owner role cannot be assigned';
  end if;

  return new;
end;
$$;

create or replace function public.prevent_owner_role_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_key text;
begin
  select role_key into v_role_key
  from public.workspace_roles
  where id = new.role_id
    and workspace_id = new.workspace_id;

  if v_role_key = 'owner' then
    raise exception 'The Owner role cannot be assigned';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_workspace_owner_membership on public.workspace_members;
create trigger protect_workspace_owner_membership
before insert or update or delete on public.workspace_members
for each row execute function public.prevent_workspace_owner_membership_change();

drop trigger if exists prevent_owner_role_invitation on public.workspace_invitations;
create trigger prevent_owner_role_invitation
before insert or update on public.workspace_invitations
for each row execute function public.prevent_owner_role_assignment();
