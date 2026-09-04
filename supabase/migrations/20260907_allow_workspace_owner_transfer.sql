-- The live database guards workspace owner/creator changes with
-- prevent_workspace_owner_transfer(), which has no bypass, so account deletion
-- could not transfer an owned workspace to its next owner.
--
-- Replace it with a guard that follows the app.workspace_deletion_id
-- convention used by the other workspace guards (see 20260901_delete_workspace
-- and 20260902_protect_workspace_owner): internal deletion flows may transfer
-- ownership while every other owner/creator change stays blocked. The existing
-- workspace_owner_transfer_guard trigger calls this function by name, so it
-- picks up the new body automatically.
create or replace function public.prevent_workspace_owner_transfer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('app.workspace_deletion_id', true) = old.id::text then
    return new;
  end if;

  if old.owner_id is distinct from new.owner_id
     or old.created_by is distinct from new.created_by then
    raise exception 'Workspace ownership and creator identity cannot be transferred';
  end if;

  return new;
end;
$$;