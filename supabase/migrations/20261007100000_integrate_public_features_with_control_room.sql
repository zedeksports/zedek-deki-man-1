-- Integrate public news notifications with Control Room publishing.
-- The trigger fires only when a news post first becomes published.
create or replace function private.notify_news_preference_followers()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog, pg_temp
as $$
begin
  if NEW.content_type = 'news'
     and NEW.status = 'published'
     and (TG_OP = 'INSERT' or OLD.status is distinct from 'published') then
    insert into public.user_notifications (user_id, notification_type, title, body, match_id, team_id)
    select p.user_id,
           'news',
           NEW.title,
           coalesce(nullif(NEW.excerpt,''),'New Zedek Sports news is available.'),
           null,
           null
    from public.user_notification_preferences p
    where p.news = true;
  end if;
  return NEW;
end;
$$;

drop trigger if exists content_posts_news_notification on public.content_posts;
create trigger content_posts_news_notification
after insert or update of status on public.content_posts
for each row
execute function private.notify_news_preference_followers();

revoke all on function private.notify_news_preference_followers() from public, anon, authenticated;
