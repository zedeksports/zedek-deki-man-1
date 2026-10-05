create schema if not exists private;

create or replace function private.enforce_reporter_assignment_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  is_reporter boolean;
begin
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'reporter'::public.app_role
      and p.is_active = true
  ) into is_reporter;

  if not is_reporter then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.reporter_id is distinct from old.reporter_id
       or new.match_id is distinct from old.match_id
       or new.assigned_at is distinct from old.assigned_at
       or new.notes is distinct from old.notes
       or new.created_at is distinct from old.created_at then
      raise exception 'Reporter assignment ownership and assignment metadata are immutable';
    end if;

    if old.status = 'assigned' and new.status = 'accepted' then
      new.accepted_at := coalesce(old.accepted_at, now());
      new.completed_at := null;
    elsif old.status = 'accepted' and new.status = 'in_progress' then
      new.accepted_at := coalesce(old.accepted_at, now());
      new.completed_at := null;
    elsif old.status = 'in_progress' and new.status = 'under_review' then
      new.accepted_at := coalesce(old.accepted_at, now());
      new.completed_at := null;
    elsif old.status = new.status and new.status in ('accepted','in_progress','under_review') then
      new.accepted_at := old.accepted_at;
      new.completed_at := old.completed_at;
    else
      raise exception 'Invalid reporter assignment status transition: % -> %', old.status, new.status;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_reporter_assignment_integrity() from public;
revoke all on function private.enforce_reporter_assignment_integrity() from anon, authenticated;

drop trigger if exists reporter_assignment_integrity_guard on public.reporter_assignments;
create trigger reporter_assignment_integrity_guard
before update on public.reporter_assignments
for each row execute function private.enforce_reporter_assignment_integrity();

create or replace function private.enforce_reporter_report_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  is_reporter boolean;
begin
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'reporter'::public.app_role
      and p.is_active = true
  ) into is_reporter;

  if not is_reporter then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.match_id is distinct from old.match_id
       or new.reporter_id is distinct from old.reporter_id
       or new.created_at is distinct from old.created_at then
      raise exception 'Reporter match report identity is immutable';
    end if;

    if old.status = 'verified' then
      raise exception 'Verified match reports are locked';
    end if;

    if old.status = 'submitted' and new.status = 'submitted' then
      null;
    elsif old.status = 'rejected' and new.status = 'submitted' then
      new.submitted_at := now();
    else
      raise exception 'Reporter can only submit or resubmit a match report';
    end if;

    new.updated_at := now();
  elsif tg_op = 'INSERT' then
    if new.reporter_id is distinct from (select auth.uid()) or new.status <> 'submitted' then
      raise exception 'Reporter report must belong to the authenticated reporter and start as submitted';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_reporter_report_integrity() from public;
revoke all on function private.enforce_reporter_report_integrity() from anon, authenticated;

drop trigger if exists reporter_match_report_integrity_guard on public.match_reports;
create trigger reporter_match_report_integrity_guard
before insert or update on public.match_reports
for each row execute function private.enforce_reporter_report_integrity();

create or replace function private.lock_verified_match()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'verified' then
    raise exception 'Verified match is locked and cannot be modified';
  end if;
  return new;
end;
$$;

revoke all on function private.lock_verified_match() from public;
revoke all on function private.lock_verified_match() from anon, authenticated;

drop trigger if exists verified_match_lock_guard on public.matches;
create trigger verified_match_lock_guard
before update on public.matches
for each row execute function private.lock_verified_match();
