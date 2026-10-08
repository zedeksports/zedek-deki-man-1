-- Lock profile access changes to the admin-only RPC while preserving safe self-service fields.

revoke all on table public.profiles from anon;

revoke all on table public.profiles from authenticated;
grant select (id, full_name, phone, role, is_active, created_at, updated_at)
  on table public.profiles to authenticated;
grant update (full_name, phone, updated_at)
  on table public.profiles to authenticated;

drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can update their own profile details" on public.profiles;

create policy "Users can update their own profile details"
on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create or replace function private.admin_set_profile_access(
  p_user_id uuid,
  p_role public.app_role,
  p_is_active boolean
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_profile public.profiles;
begin
  if not private.is_admin() then
    raise exception 'Not authorized';
  end if;

  update public.profiles
  set role = p_role,
      is_active = p_is_active,
      updated_at = now()
  where id = p_user_id
  returning * into v_profile;

  if not found then
    raise exception 'Profile not found';
  end if;

  return v_profile;
end;
$function$;

revoke all on function private.admin_set_profile_access(uuid, public.app_role, boolean) from public;
revoke all on function private.admin_set_profile_access(uuid, public.app_role, boolean) from anon;
grant execute on function private.admin_set_profile_access(uuid, public.app_role, boolean) to authenticated;

create or replace function public.admin_set_profile_access(
  p_user_id uuid,
  p_role public.app_role,
  p_is_active boolean
)
returns public.profiles
language sql
security invoker
set search_path = public, private
as $function$
  select private.admin_set_profile_access(p_user_id, p_role, p_is_active);
$function$;

revoke all on function public.admin_set_profile_access(uuid, public.app_role, boolean) from public;
revoke all on function public.admin_set_profile_access(uuid, public.app_role, boolean) from anon;
grant execute on function public.admin_set_profile_access(uuid, public.app_role, boolean) to authenticated;
