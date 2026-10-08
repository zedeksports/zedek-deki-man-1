-- Allow authenticated reporters to start matches when status-change notifications fire.
-- The public wrapper is the controlled entry point; the private implementation stays non-executable.
create or replace function public.notify_match_followers(
  p_match_id uuid,
  p_notification_type text,
  p_title text,
  p_body text
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if (select auth.uid()) is not null
     and not exists (
       select 1
       from public.profiles p
       where p.id = (select auth.uid())
         and p.is_active = true
         and p.role in (
           'super_admin'::public.app_role,
           'zedek_admin'::public.app_role,
           'reporter'::public.app_role
         )
     ) then
    raise exception 'not authorized to notify match followers';
  end if;

  perform private.notify_match_followers(
    p_match_id,
    p_notification_type,
    p_title,
    p_body
  );
end;
$function$;

revoke execute on function public.notify_match_followers(uuid, text, text, text) from public, anon;
grant execute on function public.notify_match_followers(uuid, text, text, text) to authenticated;

revoke execute on function private.notify_match_followers(uuid, text, text, text) from public, anon, authenticated;
