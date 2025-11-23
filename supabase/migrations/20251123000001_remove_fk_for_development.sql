-- Migration: Remove Foreign Key Constraints for Development
-- Purpose: Remove foreign key to auth.users for development without authentication
-- Affected tables: ratings, user_lists, ai_recommendation_requests
-- Created: 2025-11-23
-- NOTE: This migration should be reverted in production when authentication is implemented

-- ============================================================================
-- DROP FOREIGN KEY CONSTRAINTS (DEVELOPMENT ONLY)
-- ============================================================================

-- Drop foreign key constraint from ratings table
alter table public.ratings
  drop constraint ratings_user_id_fkey;

-- Drop foreign key constraint from user_lists table
alter table public.user_lists
  drop constraint user_lists_user_id_fkey;

-- Drop foreign key constraint from ai_recommendation_requests table
alter table public.ai_recommendation_requests
  drop constraint ai_recommendation_requests_user_id_fkey;

-- ============================================================================
-- NOTE: To restore foreign keys in production, run:
-- ============================================================================
-- alter table public.ratings
--   add constraint ratings_user_id_fkey
--   foreign key (user_id) references auth.users(id) on delete cascade;
--
-- alter table public.user_lists
--   add constraint user_lists_user_id_fkey
--   foreign key (user_id) references auth.users(id) on delete cascade;
--
-- alter table public.ai_recommendation_requests
--   add constraint ai_recommendation_requests_user_id_fkey
--   foreign key (user_id) references auth.users(id) on delete cascade;
