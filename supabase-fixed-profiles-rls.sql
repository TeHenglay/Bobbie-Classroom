-- Fixed RLS Policies - Resolves circular dependency issue
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- PROFILES TABLE - FIX CIRCULAR DEPENDENCY
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "All users can view based on role" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

-- Simple policy: Users can always see their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

-- Simple policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id);

-- Admin policy without circular dependency - checks role directly
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    role = 'admin' AND id = (select auth.uid())
    OR
    (select auth.uid()) = id
  );

-- Note: This ensures admins can see all when they query, but we need a separate approach
-- Let's use a simpler version that doesn't cause circular lookups

-- Drop the complex admin policy and keep it simple
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Just let users see their own profiles - admins will handle other views differently
-- The circular dependency happens when we try to check profiles.role inside a profiles policy

