-- Fix infinite recursion in admin RLS policies
-- Drop the problematic admin policies
drop policy if exists "Admins can view all users" on public.users;
drop policy if exists "Admins can update all users" on public.users;
drop policy if exists "Admins can view all videos" on public.videos;
drop policy if exists "Admins can update all videos" on public.videos;
drop policy if exists "Admins can delete all videos" on public.videos;
drop policy if exists "Admins can view all analysis results" on public.analysis_results;

-- Create a security definer function to check admin status
-- This breaks the recursion by using security definer privileges
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return exists (
    select 1
    from public.users
    where id = auth.uid()
    and is_admin = true
  );
end;
$$;

-- Recreate admin policies using the function
create policy "Admins can view all users"
  on public.users for select
  using (public.is_admin());

create policy "Admins can update all users"
  on public.users for update
  using (public.is_admin());

create policy "Admins can view all videos"
  on public.videos for select
  using (public.is_admin());

create policy "Admins can update all videos"
  on public.videos for update
  using (public.is_admin());

create policy "Admins can delete all videos"
  on public.videos for delete
  using (public.is_admin());

create policy "Admins can view all analysis results"
  on public.analysis_results for select
  using (public.is_admin());
