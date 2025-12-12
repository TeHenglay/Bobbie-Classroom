-- Consolidated RLS Policies - No Multiple Policy Warnings
-- This version combines role checks into single policies to eliminate warnings
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "All users can view based on role" ON public.profiles;

CREATE POLICY "Users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (select auth.uid()) AND p.role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id);

-- ============================================================================
-- CLASSES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can view all classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can create classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can view their own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can update their own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can delete their own classes" ON public.classes;
DROP POLICY IF EXISTS "Students can view classes they are enrolled in" ON public.classes;
DROP POLICY IF EXISTS "Admins can manage all classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can view own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can update own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can delete own classes" ON public.classes;
DROP POLICY IF EXISTS "Students can view enrolled classes" ON public.classes;
DROP POLICY IF EXISTS "All users can view based on role" ON public.classes;

CREATE POLICY "Classes select policy"
  ON public.classes FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
    OR (teacher_id = (select auth.uid()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'teacher'))
    OR (EXISTS (SELECT 1 FROM public.class_members WHERE class_id = classes.id AND student_id = (select auth.uid())) 
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'student'))
  );

CREATE POLICY "Classes insert policy"
  ON public.classes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
    OR (teacher_id = (select auth.uid()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'teacher'))
  );

CREATE POLICY "Classes update policy"
  ON public.classes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
    OR teacher_id = (select auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
    OR teacher_id = (select auth.uid())
  );

CREATE POLICY "Classes delete policy"
  ON public.classes FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
    OR teacher_id = (select auth.uid())
  );

-- ============================================================================
-- CLASS_MEMBERS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage all class members" ON public.class_members;
DROP POLICY IF EXISTS "Students can create enrollments for themselves" ON public.class_members;
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.class_members;
DROP POLICY IF EXISTS "Teachers can view members of their classes" ON public.class_members;
DROP POLICY IF EXISTS "Teachers can remove students from their classes" ON public.class_members;
DROP POLICY IF EXISTS "Admins can manage class members" ON public.class_members;
DROP POLICY IF EXISTS "Students can join classes" ON public.class_members;
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.class_members;
DROP POLICY IF EXISTS "Teachers can view class members" ON public.class_members;
DROP POLICY IF EXISTS "Teachers can remove class members" ON public.class_members;

CREATE POLICY "Class members select policy"
  ON public.class_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
    OR (student_id = (select auth.uid()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'student'))
    OR (EXISTS (SELECT 1 FROM public.classes WHERE id = class_members.class_id AND teacher_id = (select auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'teacher'))
  );

CREATE POLICY "Class members insert policy"
  ON public.class_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
    OR (student_id = (select auth.uid()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'student'))
  );

CREATE POLICY "Class members delete policy"
  ON public.class_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.classes WHERE id = class_members.class_id AND teacher_id = (select auth.uid()))
  );

-- ============================================================================
-- ASSIGNMENTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can view all assignments" ON public.assignments;
DROP POLICY IF EXISTS "Teachers can manage assignments for their classes" ON public.assignments;
DROP POLICY IF EXISTS "Students can view assignments for their classes" ON public.assignments;
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.assignments;
DROP POLICY IF EXISTS "Teachers can manage own assignments" ON public.assignments;
DROP POLICY IF EXISTS "Students can view class assignments" ON public.assignments;

CREATE POLICY "Assignments select policy"
  ON public.assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
    OR (EXISTS (SELECT 1 FROM public.classes WHERE id = assignments.class_id AND teacher_id = (select auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'teacher'))
    OR (EXISTS (SELECT 1 FROM public.class_members WHERE class_id = assignments.class_id AND student_id = (select auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'student'))
  );

CREATE POLICY "Assignments insert policy"
  ON public.assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
    OR (EXISTS (SELECT 1 FROM public.classes WHERE id = assignments.class_id AND teacher_id = (select auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'teacher'))
  );

CREATE POLICY "Assignments update policy"
  ON public.assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
    OR (EXISTS (SELECT 1 FROM public.classes WHERE id = assignments.class_id AND teacher_id = (select auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'teacher'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.classes WHERE id = assignments.class_id AND teacher_id = (select auth.uid()))
  );

CREATE POLICY "Assignments delete policy"
  ON public.assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
    OR (EXISTS (SELECT 1 FROM public.classes WHERE id = assignments.class_id AND teacher_id = (select auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'teacher'))
  );

-- ============================================================================
-- SUBMISSIONS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.submissions;
DROP POLICY IF EXISTS "Students can create their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Students can view their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Students can update their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Teachers can view submissions for their assignments" ON public.submissions;
DROP POLICY IF EXISTS "Teachers can grade submissions for their assignments" ON public.submissions;
DROP POLICY IF EXISTS "Admins can manage submissions" ON public.submissions;
DROP POLICY IF EXISTS "Students can create own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Students can view own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Students can update own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Teachers can view class submissions" ON public.submissions;
DROP POLICY IF EXISTS "Teachers can grade submissions" ON public.submissions;

CREATE POLICY "Submissions select policy"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
    OR (student_id = (select auth.uid()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'student'))
    OR (EXISTS (SELECT 1 FROM public.assignments a JOIN public.classes c ON c.id = a.class_id 
                WHERE a.id = submissions.assignment_id AND c.teacher_id = (select auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'teacher'))
  );

CREATE POLICY "Submissions insert policy"
  ON public.submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
    OR (student_id = (select auth.uid()) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'student'))
  );

CREATE POLICY "Submissions update policy"
  ON public.submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
    OR (student_id = (select auth.uid()) AND status != 'graded')
    OR EXISTS (SELECT 1 FROM public.assignments a JOIN public.classes c ON c.id = a.class_id 
               WHERE a.id = submissions.assignment_id AND c.teacher_id = (select auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
    OR (student_id = (select auth.uid()) AND status != 'graded')
    OR EXISTS (SELECT 1 FROM public.assignments a JOIN public.classes c ON c.id = a.class_id 
               WHERE a.id = submissions.assignment_id AND c.teacher_id = (select auth.uid()))
  );

-- ============================================================================
-- ANNOUNCEMENTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage all announcements" ON public.announcements;
DROP POLICY IF EXISTS "Teachers can manage announcements for their classes" ON public.announcements;
DROP POLICY IF EXISTS "Students can view announcements for their classes" ON public.announcements;
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
DROP POLICY IF EXISTS "Teachers can manage own announcements" ON public.announcements;
DROP POLICY IF EXISTS "Students can view class announcements" ON public.announcements;

CREATE POLICY "Announcements select policy"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
    OR (EXISTS (SELECT 1 FROM public.classes WHERE id = announcements.class_id AND teacher_id = (select auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'teacher'))
    OR (EXISTS (SELECT 1 FROM public.class_members WHERE class_id = announcements.class_id AND student_id = (select auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'student'))
  );

CREATE POLICY "Announcements insert policy"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
    OR (EXISTS (SELECT 1 FROM public.classes WHERE id = announcements.class_id AND teacher_id = (select auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'teacher'))
  );

CREATE POLICY "Announcements update policy"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
    OR (EXISTS (SELECT 1 FROM public.classes WHERE id = announcements.class_id AND teacher_id = (select auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'teacher'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.classes WHERE id = announcements.class_id AND teacher_id = (select auth.uid()))
  );

CREATE POLICY "Announcements delete policy"
  ON public.announcements FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
    OR (EXISTS (SELECT 1 FROM public.classes WHERE id = announcements.class_id AND teacher_id = (select auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'teacher'))
  );

-- ============================================================================
-- LECTURES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage all lectures" ON public.lectures;
DROP POLICY IF EXISTS "Teachers can manage lectures for their classes" ON public.lectures;
DROP POLICY IF EXISTS "Students can view lectures for their classes" ON public.lectures;
DROP POLICY IF EXISTS "Admins can manage lectures" ON public.lectures;
DROP POLICY IF EXISTS "Teachers can manage own lectures" ON public.lectures;
DROP POLICY IF EXISTS "Students can view class lectures" ON public.lectures;

CREATE POLICY "Lectures select policy"
  ON public.lectures FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
    OR (EXISTS (SELECT 1 FROM public.classes WHERE id = lectures.class_id AND teacher_id = (select auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'teacher'))
    OR (EXISTS (SELECT 1 FROM public.class_members WHERE class_id = lectures.class_id AND student_id = (select auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'student'))
  );

CREATE POLICY "Lectures insert policy"
  ON public.lectures FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
    OR (EXISTS (SELECT 1 FROM public.classes WHERE id = lectures.class_id AND teacher_id = (select auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'teacher'))
  );

CREATE POLICY "Lectures update policy"
  ON public.lectures FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
    OR (EXISTS (SELECT 1 FROM public.classes WHERE id = lectures.class_id AND teacher_id = (select auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'teacher'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.classes WHERE id = lectures.class_id AND teacher_id = (select auth.uid()))
  );

CREATE POLICY "Lectures delete policy"
  ON public.lectures FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
    OR (EXISTS (SELECT 1 FROM public.classes WHERE id = lectures.class_id AND teacher_id = (select auth.uid()))
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'teacher'))
  );

-- ============================================================================
-- Verify policies are set up correctly
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;
