alter table public.site_analytics_events
  add column if not exists event_key text;

create unique index if not exists site_analytics_events_event_key_uidx
  on public.site_analytics_events(event_key)
  where event_key is not null;

-- Keep aggregate analytics views private by making them obey the
-- underlying site's RLS policies.
alter view public.site_analytics_daily set (security_invoker = true);
alter view public.site_analytics_top_pages set (security_invoker = true);

create or replace view public.site_analytics_summary
with (security_invoker = true)
as
select
  count(distinct visitor_id) filter (where occurred_at >= current_date) as today_unique_visitors,
  count(*) filter (where event_type = 'page_view' and occurred_at >= current_date) as today_page_views,
  count(distinct session_id) filter (where event_type = 'session_start' and occurred_at >= current_date) as today_sessions,
  count(distinct visitor_id) filter (where occurred_at >= current_date - interval '7 days') as week_unique_visitors
from public.site_analytics_events;

-- Keep the analytics RLS authorization check efficient at scale.
drop policy if exists site_analytics_admin_select on public.site_analytics_events;
create policy site_analytics_admin_select
on public.site_analytics_events
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('super_admin','zedek_admin')
      and p.is_active = true
  )
);
