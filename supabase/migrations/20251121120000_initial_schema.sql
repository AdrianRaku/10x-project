-- Migration: Initial Schema for MyFilms Application
-- Purpose: Create core tables (ratings, user_lists, ai_recommendation_requests) with RLS policies
-- Affected tables: ratings, user_lists, ai_recommendation_requests
-- Created: 2025-11-21

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable moddatetime extension for automatic updated_at handling
create extension if not exists moddatetime with schema extensions;

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

-- Enum for user list types: watchlist (Do obejrzenia), favorite (Ulubione)
create type public.list_type as enum ('watchlist', 'favorite');

-- ============================================================================
-- TABLE: ratings
-- ============================================================================
-- Stores movie ratings (1-10) given by users

create table public.ratings (
  id bigint primary key generated always as identity,
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id integer not null,
  rating smallint not null check (rating >= 1 and rating <= 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, tmdb_id)
);

-- Index for faster user-based queries
create index ratings_user_id_idx on public.ratings (user_id);

-- Trigger to auto-update updated_at column
create trigger handle_ratings_updated_at
  before update on public.ratings
  for each row execute procedure moddatetime(updated_at);

-- Enable Row Level Security
alter table public.ratings enable row level security;

-- RLS Policies for ratings table
-- Users can only access their own ratings

-- SELECT policy for authenticated users
create policy "ratings_select_authenticated"
  on public.ratings for select
  to authenticated
  using (auth.uid() = user_id);

-- INSERT policy for authenticated users
create policy "ratings_insert_authenticated"
  on public.ratings for insert
  to authenticated
  with check (auth.uid() = user_id);

-- UPDATE policy for authenticated users
create policy "ratings_update_authenticated"
  on public.ratings for update
  to authenticated
  using (auth.uid() = user_id);

-- DELETE policy for authenticated users
create policy "ratings_delete_authenticated"
  on public.ratings for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================================
-- TABLE: user_lists
-- ============================================================================
-- Stores movies added to personal lists (watchlist, favorites)

create table public.user_lists (
  id bigint primary key generated always as identity,
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id integer not null,
  list_type public.list_type not null,
  created_at timestamptz not null default now(),
  unique (user_id, tmdb_id, list_type)
);

-- Indexes for faster queries
create index user_lists_user_id_idx on public.user_lists (user_id);
create index user_lists_user_id_list_type_idx on public.user_lists (user_id, list_type);

-- Enable Row Level Security
alter table public.user_lists enable row level security;

-- RLS Policies for user_lists table
-- Users can only access their own lists

-- SELECT policy for authenticated users
create policy "user_lists_select_authenticated"
  on public.user_lists for select
  to authenticated
  using (auth.uid() = user_id);

-- INSERT policy for authenticated users
create policy "user_lists_insert_authenticated"
  on public.user_lists for insert
  to authenticated
  with check (auth.uid() = user_id);

-- UPDATE policy for authenticated users
create policy "user_lists_update_authenticated"
  on public.user_lists for update
  to authenticated
  using (auth.uid() = user_id);

-- DELETE policy for authenticated users
create policy "user_lists_delete_authenticated"
  on public.user_lists for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================================
-- TABLE: ai_recommendation_requests
-- ============================================================================
-- Logs AI recommendation requests for daily limit management

create table public.ai_recommendation_requests (
  id bigint primary key generated always as identity,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Index for checking daily limits (user + date)
create index ai_recommendation_requests_user_id_created_at_idx
  on public.ai_recommendation_requests (user_id, created_at);

-- Enable Row Level Security
alter table public.ai_recommendation_requests enable row level security;

-- RLS Policies for ai_recommendation_requests table
-- Users can only access their own request logs

-- SELECT policy for authenticated users
create policy "ai_recommendation_requests_select_authenticated"
  on public.ai_recommendation_requests for select
  to authenticated
  using (auth.uid() = user_id);

-- INSERT policy for authenticated users
create policy "ai_recommendation_requests_insert_authenticated"
  on public.ai_recommendation_requests for insert
  to authenticated
  with check (auth.uid() = user_id);