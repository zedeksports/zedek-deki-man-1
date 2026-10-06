alter table public.site_analytics_events
  add column if not exists event_key text;

create unique index if not exists site_analytics_events_event_key_uidx
  on public.site_analytics_events(event_key)
  where event_key is not null;

-- Keep aggregate analytics views private by making them obey the
-- underlying site's RLS policies.
alter view public.site_analytics_daily set (security_invoker = true);
alter view public.site_analytics_top_pages set (security_invoker = true);
