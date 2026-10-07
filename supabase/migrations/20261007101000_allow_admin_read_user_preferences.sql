-- Allow the Control Room admin role to inspect public-app preferences.
create policy "Admins can read user settings"
on public.user_settings
for select
to authenticated
using ((select private.is_admin()));

create policy "Admins can read notification preferences"
on public.user_notification_preferences
for select
to authenticated
using ((select private.is_admin()));
