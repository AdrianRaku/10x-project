-- Migration: Add Anonymous Access Policies for Development
-- Purpose: Enable anonymous access to ratings table for development without authentication
-- Affected tables: ratings
-- Created: 2025-11-23
-- NOTE: These policies should be removed in production when authentication is implemented

-- ============================================================================
-- ANON POLICIES FOR RATINGS TABLE (DEVELOPMENT ONLY)
-- ============================================================================

-- SELECT policy for anonymous users (allow all)
create policy "ratings_select_anon"
  on public.ratings for select
  to anon
  using (true);

-- INSERT policy for anonymous users (allow all)
create policy "ratings_insert_anon"
  on public.ratings for insert
  to anon
  with check (true);

-- UPDATE policy for anonymous users (allow all)
create policy "ratings_update_anon"
  on public.ratings for update
  to anon
  using (true);

-- DELETE policy for anonymous users (allow all)
create policy "ratings_delete_anon"
  on public.ratings for delete
  to anon
  using (true);
