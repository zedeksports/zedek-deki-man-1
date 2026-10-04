-- Zedek Sports Phase 5: moderation, sponsor presentation and notification delivery
-- Notification delivery is driven by existing follower preference functions; this batch adds the missing triggers
-- and gives admins a narrowly scoped insert path for official broadcasts.

drop policy if exists "Admins can create notifications" on public.user_notifications;
create policy "Admins can create notifications"
on public.user_notifications
for insert
to authenticated
with check ((select private.is_admin()));

grant insert on public.user_notifications to authenticated;

drop trigger if exists matches_notify_status_followers on public.matches;
create trigger matches_notify_status_followers
after update of status on public.matches
for each row
when (old.status is distinct from new.status)
execute function public.notify_match_status_followers();

drop trigger if exists match_events_notify_followers on public.match_events;
create trigger match_events_notify_followers
after insert on public.match_events
for each row
execute function public.notify_match_event_followers();

drop trigger if exists match_lineups_notify_followers on public.match_lineups;
create trigger match_lineups_notify_followers
after insert on public.match_lineups
for each row
execute function public.notify_lineup_followers();

create index if not exists user_notifications_user_read_created_idx
on public.user_notifications(user_id, read_at, created_at desc);

create index if not exists sponsors_active_dates_idx
on public.sponsors(status, start_date, end_date);

create index if not exists ad_slots_public_placement_active_idx
on public.ad_slots(placement, active, start_date, end_date);