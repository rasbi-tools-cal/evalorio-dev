-- Admin-only lookups that need auth.users (emails), which PostgREST cannot expose directly.
create or replace function public.admin_users(p_query text default null, p_limit int default 50)
returns table (id uuid, email text, display_name text, role public.user_role, is_banned boolean, is_trusted boolean,
               created_at timestamptz, listings bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select p.id, u.email::text, p.display_name, p.role, p.is_banned, p.is_trusted, p.created_at,
           (select count(*) from public.listings l where l.owner_id = p.id)
    from public.profiles p
    join auth.users u on u.id = p.id
    where p_query is null or u.email ilike '%' || p_query || '%' or p.display_name ilike '%' || p_query || '%'
    order by p.created_at desc
    limit least(greatest(p_limit, 1), 200);
end;
$$;
grant execute on function public.admin_users(text, int) to authenticated;

create or replace function public.admin_user_email(p_user_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return (select email::text from auth.users where id = p_user_id);
end;
$$;
grant execute on function public.admin_user_email(uuid) to authenticated;
