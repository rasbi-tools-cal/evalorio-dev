-- GDPR: proof of cookie consent, data subject requests, and automatic retention.

---------------------------------------------------------------------------------------------------
-- Consent records (Art. 7(1) GDPR: be able to demonstrate consent). Written by the server only.
---------------------------------------------------------------------------------------------------
create table public.consent_records (
  id bigint generated always as identity primary key,
  consent_id uuid not null,
  user_id uuid references public.profiles (id) on delete set null,
  policy_version text not null,
  categories jsonb not null check (jsonb_typeof(categories) = 'object'),
  action text not null check (action in ('accept_all', 'reject_all', 'custom', 'gpc')),
  ip_hash text,
  created_at timestamptz not null default now()
);
create index consent_records_consent_idx on public.consent_records (consent_id, created_at desc);
create index consent_records_user_idx on public.consent_records (user_id, created_at desc);

alter table public.consent_records enable row level security;
create policy "users read their consent history" on public.consent_records
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
grant select on public.consent_records to authenticated;

---------------------------------------------------------------------------------------------------
-- Data subject requests (Arts. 15–22 GDPR): one month to answer (Art. 12(3)).
---------------------------------------------------------------------------------------------------
create type public.privacy_request_type as enum (
  'access', 'rectification', 'erasure', 'restriction', 'portability', 'objection', 'withdraw_consent', 'other'
);
create type public.privacy_request_status as enum ('received', 'verifying', 'in_progress', 'completed', 'rejected');

create sequence public.privacy_request_seq;

create table public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique
    default 'PR-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.privacy_request_seq')::text, 6, '0'),
  user_id uuid references public.profiles (id) on delete set null,
  email text not null check (char_length(email) <= 254),
  name text check (name is null or char_length(name) <= 100),
  type public.privacy_request_type not null,
  details text check (details is null or char_length(details) <= 3000),
  locale text not null default 'en' check (locale in ('en', 'es', 'fr', 'it', 'pt')),
  status public.privacy_request_status not null default 'received',
  admin_note text check (admin_note is null or char_length(admin_note) <= 3000),
  ip_hash text,
  due_at timestamptz not null default now() + interval '30 days',
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index privacy_requests_status_idx on public.privacy_requests (status, due_at);
create index privacy_requests_user_idx on public.privacy_requests (user_id);

create trigger privacy_requests_updated_at before update on public.privacy_requests
  for each row execute function public.set_updated_at();

alter table public.privacy_requests enable row level security;
create policy "requesters and admins read requests" on public.privacy_requests
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
grant select on public.privacy_requests to authenticated;

create or replace function public.update_privacy_request(p_id uuid, p_status public.privacy_request_status, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.privacy_requests
     set status = p_status,
         admin_note = coalesce(left(p_note, 3000), admin_note),
         resolved_at = case when p_status in ('completed', 'rejected') then now() else null end
   where id = p_id;
  insert into public.moderation_log (actor_id, action, note)
  values (auth.uid(), 'privacy_request_' || p_status, p_id::text);
end;
$$;
grant execute on function public.update_privacy_request(uuid, public.privacy_request_status, text) to authenticated;

---------------------------------------------------------------------------------------------------
-- Retention (storage limitation, Art. 5(1)(e)): keep only what we still need, see docs/gdpr.
---------------------------------------------------------------------------------------------------
create or replace function public.gdpr_retention()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb := '{}'::jsonb;
  n int;
begin
  update public.phone_reveals set ip_hash = null where ip_hash is not null and created_at < now() - interval '90 days';
  get diagnostics n = row_count; result := result || jsonb_build_object('phone_reveal_ips_cleared', n);

  update public.reports set ip_hash = null where ip_hash is not null and created_at < now() - interval '12 months';
  get diagnostics n = row_count; result := result || jsonb_build_object('report_ips_cleared', n);

  delete from public.reports where status <> 'open' and resolved_at < now() - interval '24 months';
  get diagnostics n = row_count; result := result || jsonb_build_object('reports_deleted', n);

  delete from public.messages where created_at < now() - interval '24 months';
  get diagnostics n = row_count; result := result || jsonb_build_object('messages_deleted', n);

  delete from public.consent_records where created_at < now() - interval '36 months';
  get diagnostics n = row_count; result := result || jsonb_build_object('consent_records_deleted', n);

  update public.privacy_requests set ip_hash = null where ip_hash is not null and created_at < now() - interval '90 days';
  delete from public.privacy_requests where resolved_at < now() - interval '36 months';
  get diagnostics n = row_count; result := result || jsonb_build_object('privacy_requests_deleted', n);

  delete from public.listing_price_history where changed_at < now() - interval '36 months';
  delete from public.moderation_log where created_at < now() - interval '36 months';
  delete from public.rate_limits where window_start < now() - interval '2 days';
  return result;
end;
$$;
revoke execute on function public.gdpr_retention() from public, anon, authenticated;

select cron.schedule('evalorio-gdpr-retention', '30 3 * * *', $$select public.gdpr_retention()$$);
