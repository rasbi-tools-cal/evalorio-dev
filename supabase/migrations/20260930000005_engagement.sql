-- Favorites, saved searches (email alerts), owner contact, reports, moderation, rate limiting.

create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  listing_id bigint not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
create index favorites_listing_idx on public.favorites (listing_id);

alter table public.favorites enable row level security;
create policy "own favorites" on public.favorites
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
grant select, delete on public.favorites to authenticated;
grant insert (user_id, listing_id) on public.favorites to authenticated;

create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  -- Normalised search filters, see lib/search/filters.ts
  filters jsonb not null check (jsonb_typeof(filters) = 'object' and pg_column_size(filters) < 4000),
  locale text not null default 'en' check (locale in ('en', 'es', 'fr', 'it', 'pt')),
  frequency public.alert_frequency not null default 'daily',
  is_active boolean not null default true,
  last_sent_at timestamptz,
  unsubscribe_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now()
);
create index saved_searches_user_idx on public.saved_searches (user_id);
create index saved_searches_due_idx on public.saved_searches (frequency, last_sent_at) where is_active;

create or replace function public.saved_searches_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.saved_searches where user_id = new.user_id) >= 20 then
    raise exception 'you can save at most 20 searches' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger saved_searches_limit before insert on public.saved_searches
  for each row execute function public.saved_searches_limit();

alter table public.saved_searches enable row level security;
create policy "own saved searches" on public.saved_searches
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
grant select, delete on public.saved_searches to authenticated;
grant insert (user_id, name, filters, locale, frequency, is_active),
      update (name, frequency, is_active)
  on public.saved_searches to authenticated;

-- Messages to owners. Inserted only by the server (after captcha + rate limit), read by both parties.
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  listing_id bigint not null references public.listings (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null,
  sender_name text not null check (char_length(sender_name) between 2 and 60),
  sender_email text not null check (sender_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(sender_email) <= 254),
  sender_phone text check (sender_phone is null or sender_phone ~ '^\+?[0-9 ()-]{6,20}$'),
  body text not null check (char_length(body) between 10 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index messages_recipient_idx on public.messages (recipient_id, created_at desc);
create index messages_sender_idx on public.messages (sender_id, created_at desc);

alter table public.messages enable row level security;
create policy "participants read messages" on public.messages
  for select to authenticated
  using (recipient_id = (select auth.uid()) or sender_id = (select auth.uid()) or (select public.is_admin()));
create policy "recipient marks read" on public.messages
  for update to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));
grant select on public.messages to authenticated;
grant update (read_at) on public.messages to authenticated;

-- Phone reveals: analytics for the owner and abuse detection. Server-written only.
create table public.phone_reveals (
  id bigint generated always as identity primary key,
  listing_id bigint not null references public.listings (id) on delete cascade,
  viewer_id uuid references public.profiles (id) on delete set null,
  ip_hash text,
  created_at timestamptz not null default now()
);
create index phone_reveals_listing_idx on public.phone_reveals (listing_id, created_at desc);
alter table public.phone_reveals enable row level security;
create policy "owners see reveal stats" on public.phone_reveals
  for select to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid())));
grant select on public.phone_reveals to authenticated;

-- Reports from visitors. Server-written; admins handle them.
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  listing_id bigint not null references public.listings (id) on delete cascade,
  reporter_id uuid references public.profiles (id) on delete set null,
  reporter_email text check (reporter_email is null or char_length(reporter_email) <= 254),
  reason public.report_reason not null,
  details text check (details is null or char_length(details) <= 1000),
  status public.report_status not null default 'open',
  ip_hash text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id) on delete set null
);
create index reports_open_idx on public.reports (status, created_at desc);
create index reports_listing_idx on public.reports (listing_id);
alter table public.reports enable row level security;
create policy "admins read reports" on public.reports
  for select to authenticated using ((select public.is_admin()));
grant select on public.reports to authenticated;

create table public.moderation_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  listing_id bigint references public.listings (id) on delete set null,
  target_user_id uuid references public.profiles (id) on delete set null,
  action text not null,
  note text,
  created_at timestamptz not null default now()
);
create index moderation_log_created_idx on public.moderation_log (created_at desc);
alter table public.moderation_log enable row level security;
create policy "admins read log" on public.moderation_log
  for select to authenticated using ((select public.is_admin()));
grant select on public.moderation_log to authenticated;

---------------------------------------------------------------------------------------------------
-- Rate limiting (fixed window). Only the server (service role) can call it.
---------------------------------------------------------------------------------------------------
create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (key, window_start)
);
alter table public.rate_limits enable row level security;

create or replace function public.hit_rate_limit(p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  bucket timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  current_hits int;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, bucket, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning hits into current_hits;
  return current_hits <= p_limit;
end;
$$;
revoke execute on function public.hit_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, int, int) to service_role;

---------------------------------------------------------------------------------------------------
-- Admin actions. Each checks is_admin() itself and writes the moderation log.
---------------------------------------------------------------------------------------------------
create or replace function public.moderate_listing(p_listing_id bigint, p_action text, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.listings;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into target from public.listings where id = p_listing_id for update;
  if not found then
    raise exception 'listing not found' using errcode = 'P0002';
  end if;

  perform set_config('evalorio.bypass_guard', 'on', true);
  if p_action = 'approve' then
    update public.listings set status = 'active' where id = p_listing_id;
    update public.profiles set is_trusted = true where id = target.owner_id;
  elsif p_action = 'reject' then
    update public.listings set status = 'rejected', rejection_reason = left(p_note, 500) where id = p_listing_id;
  elsif p_action = 'remove' then
    update public.listings set status = 'removed', rejection_reason = left(p_note, 500) where id = p_listing_id;
  else
    raise exception 'unknown action %', p_action;
  end if;
  perform set_config('evalorio.bypass_guard', '', true);

  insert into public.moderation_log (actor_id, listing_id, target_user_id, action, note)
  values (auth.uid(), p_listing_id, target.owner_id, 'listing_' || p_action, left(p_note, 500));
end;
$$;

create or replace function public.set_user_banned(p_user_id uuid, p_banned boolean, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'you cannot ban yourself';
  end if;
  update public.profiles set is_banned = p_banned, is_trusted = case when p_banned then false else is_trusted end
   where id = p_user_id;
  if p_banned then
    perform set_config('evalorio.bypass_guard', 'on', true);
    update public.listings set status = 'removed'
     where owner_id = p_user_id and status in ('pending', 'active', 'paused');
    perform set_config('evalorio.bypass_guard', '', true);
  end if;
  insert into public.moderation_log (actor_id, target_user_id, action, note)
  values (auth.uid(), p_user_id, case when p_banned then 'user_banned' else 'user_unbanned' end, left(p_note, 500));
end;
$$;

create or replace function public.resolve_report(p_report_id uuid, p_status public.report_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.reports
     set status = p_status, resolved_at = case when p_status = 'open' then null else now() end,
         resolved_by = case when p_status = 'open' then null else auth.uid() end
   where id = p_report_id;
  insert into public.moderation_log (actor_id, action, note)
  values (auth.uid(), 'report_' || p_status, p_report_id::text);
end;
$$;

grant execute on function public.moderate_listing(bigint, text, text) to authenticated;
grant execute on function public.set_user_banned(uuid, boolean, text) to authenticated;
grant execute on function public.resolve_report(uuid, public.report_status) to authenticated;

-- Owner renews an expired listing for another 90 days (goes back through the normal guard).
create or replace function public.renew_listing(p_listing_id bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated int;
begin
  if public.is_banned() then
    raise exception 'account suspended' using errcode = '42501';
  end if;
  perform set_config('evalorio.bypass_guard', 'on', true);
  update public.listings
     set status = case when (select is_trusted from public.profiles where id = owner_id) then 'active'::public.listing_status
                       else 'pending'::public.listing_status end,
         expires_at = now() + interval '90 days'
   where id = p_listing_id and owner_id = auth.uid() and status in ('expired', 'active', 'paused');
  get diagnostics updated = row_count;
  perform set_config('evalorio.bypass_guard', '', true);
  if updated = 0 then
    raise exception 'listing cannot be renewed' using errcode = '42501';
  end if;
end;
$$;
grant execute on function public.renew_listing(bigint) to authenticated;
