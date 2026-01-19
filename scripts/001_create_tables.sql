-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create users table (extends auth.users with profile data)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  credits integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create videos table
create table if not exists public.videos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  filename text not null,
  file_url text not null,
  status text not null default 'pending', -- pending, processing, analyzing, generating, completed, failed
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create analysis_results table
create table if not exists public.analysis_results (
  id uuid primary key default uuid_generate_v4(),
  video_id uuid not null references public.videos(id) on delete cascade,
  property_score integer,
  detected_rooms jsonb, -- array of room objects
  estimated_surface numeric,
  finishes_quality text,
  ai_description text,
  ai_titles jsonb, -- array of title options
  ai_hashtags jsonb, -- array of hashtags
  tiktok_video_url text,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security on all tables
alter table public.users enable row level security;
alter table public.videos enable row level security;
alter table public.analysis_results enable row level security;

-- RLS Policies for users table
create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

-- RLS Policies for videos table
create policy "Users can view their own videos"
  on public.videos for select
  using (auth.uid() = user_id);

create policy "Users can insert their own videos"
  on public.videos for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own videos"
  on public.videos for update
  using (auth.uid() = user_id);

create policy "Users can delete their own videos"
  on public.videos for delete
  using (auth.uid() = user_id);

-- RLS Policies for analysis_results table
create policy "Users can view their own analysis results"
  on public.analysis_results for select
  using (
    exists (
      select 1 from public.videos
      where videos.id = analysis_results.video_id
      and videos.user_id = auth.uid()
    )
  );

create policy "Users can insert their own analysis results"
  on public.analysis_results for insert
  with check (
    exists (
      select 1 from public.videos
      where videos.id = analysis_results.video_id
      and videos.user_id = auth.uid()
    )
  );

-- Create function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, credits)
  values (
    new.id,
    new.email,
    1 -- New users get 1 free credit
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Create trigger to auto-create user profile on signup
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Create function to update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create triggers for updated_at
create trigger update_users_updated_at
  before update on public.users
  for each row
  execute function public.update_updated_at();

create trigger update_videos_updated_at
  before update on public.videos
  for each row
  execute function public.update_updated_at();
