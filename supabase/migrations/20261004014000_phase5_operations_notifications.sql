-- Zedek Sports Phase 5: moderation, sponsor presentation and notification delivery
-- The existing notification engine already has match status, event and lineup triggers.
-- This migration hardens the admin broadcast path and removes direct RPC exposure from notification helpers.

drop policy if exists "Admins can create notifications" on public.user_notifications;
create policy "Admins can create notifications"
on public.user_notifications
for insert
to authenticated
with check ((select private.is_admin()));

grant insert on public.user_notifications to authenticated;

revoke execute on function public.notify_lineup_followers() from public;
revoke execute on function public.notify_match_event_followers() from public;
revoke execute on function public.notify_match_followers(uuid,text,text,text) from public;

create index if not exists user_notifications_user_read_created_idx
on public.user_notifications(user_id, read_at, created_at desc);

create index if not exists sponsors_active_dates_idx
on public.sponsors(status, start_date, end_date);

create index if not exists ad_slots_public_placement_active_idx
on public.ad_slots(placement, active, start_date, end_date);