-- Quick Fix for Class Creation and Other Issues
-- Run this in Supabase SQL Editor

-- ============================================================================
-- FIX CLASSES TABLE INSERT POLICY
-- ============================================================================
DROP POLICY IF EXISTS "Teachers can create classes" ON public.classes;
DROP POLICY IF EXISTS "Classes insert policy" ON public.classes;

-- Simple insert policy without role check to avoid circular dependency
CREATE POLICY "Teachers can create classes"
  ON public.classes FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = (select auth.uid()));

-- ============================================================================
-- ENSURE OTHER POLICIES EXIST
-- ============================================================================

-- Make sure the SELECT policies exist for classes
DROP POLICY IF EXISTS "Teachers can view own classes" ON public.classes;
DROP POLICY IF EXISTS "Classes select policy" ON public.classes;

CREATE POLICY "Teachers can view own classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (teacher_id = (select auth.uid()));

-- ============================================================================
-- VERIFY RLS IS ENABLED
-- ============================================================================
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'classes';
