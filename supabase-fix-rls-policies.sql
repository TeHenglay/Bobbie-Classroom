-- Fix RLS Policies - Remove duplicates and properly structure policies
-- Run this in your Supabase SQL Editor after enabling RLS

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- CLASSES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can view all classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can create classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can view their own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can update their own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can delete their own classes" ON public.classes;
DROP POLICY IF EXISTS "Students can view classes they are enrolled in" ON public.classes;

-- Admin policy for all operations
CREATE POLICY "Admins can manage all classes"
  ON public.classes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Teacher policies
CREATE POLICY "Teachers can create classes"
  ON public.classes FOR INSERT
  TO authenticated
  WITH CHECK (
    teacher_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Teachers can view own classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (
    teacher_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update own classes"
  ON public.classes FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete own classes"
  ON public.classes FOR DELETE
  TO authenticated
  USING (teacher_id = auth.uid());

-- Student policy
CREATE POLICY "Students can view enrolled classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.class_members
      WHERE class_id = classes.id AND student_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- ============================================================================
-- CLASS_MEMBERS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage all class members" ON public.class_members;
DROP POLICY IF EXISTS "Students can create enrollments for themselves" ON public.class_members;
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.class_members;
DROP POLICY IF EXISTS "Teachers can view members of their classes" ON public.class_members;
DROP POLICY IF EXISTS "Teachers can remove students from their classes" ON public.class_members;

-- Admin policy
CREATE POLICY "Admins can manage class members"
  ON public.class_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Student policies
CREATE POLICY "Students can join classes"
  ON public.class_members FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

CREATE POLICY "Students can view own enrollments"
  ON public.class_members FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- Teacher policies
CREATE POLICY "Teachers can view class members"
  ON public.class_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = class_members.class_id AND teacher_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Teachers can remove class members"
  ON public.class_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = class_members.class_id AND teacher_id = auth.uid()
    )
  );

-- ============================================================================
-- ASSIGNMENTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can view all assignments" ON public.assignments;
DROP POLICY IF EXISTS "Teachers can manage assignments for their classes" ON public.assignments;
DROP POLICY IF EXISTS "Students can view assignments for their classes" ON public.assignments;

-- Admin policy
CREATE POLICY "Admins can manage assignments"
  ON public.assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Teacher policies
CREATE POLICY "Teachers can manage own assignments"
  ON public.assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = assignments.class_id AND teacher_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = assignments.class_id AND teacher_id = auth.uid()
    )
  );

-- Student policy
CREATE POLICY "Students can view class assignments"
  ON public.assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.class_members
      WHERE class_id = assignments.class_id AND student_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'student'
    )
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

-- Admin policy
CREATE POLICY "Admins can manage submissions"
  ON public.submissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Student policies
CREATE POLICY "Students can create own submissions"
  ON public.submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

CREATE POLICY "Students can view own submissions"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

CREATE POLICY "Students can update own submissions"
  ON public.submissions FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid() AND status != 'graded')
  WITH CHECK (student_id = auth.uid() AND status != 'graded');

-- Teacher policies
CREATE POLICY "Teachers can view class submissions"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.classes c ON c.id = a.class_id
      WHERE a.id = submissions.assignment_id AND c.teacher_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Teachers can grade submissions"
  ON public.submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.classes c ON c.id = a.class_id
      WHERE a.id = submissions.assignment_id AND c.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.classes c ON c.id = a.class_id
      WHERE a.id = submissions.assignment_id AND c.teacher_id = auth.uid()
    )
  );

-- ============================================================================
-- ANNOUNCEMENTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage all announcements" ON public.announcements;
DROP POLICY IF EXISTS "Teachers can manage announcements for their classes" ON public.announcements;
DROP POLICY IF EXISTS "Students can view announcements for their classes" ON public.announcements;

-- Admin policy
CREATE POLICY "Admins can manage announcements"
  ON public.announcements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Teacher policies
CREATE POLICY "Teachers can manage own announcements"
  ON public.announcements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = announcements.class_id AND teacher_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = announcements.class_id AND teacher_id = auth.uid()
    )
  );

-- Student policy
CREATE POLICY "Students can view class announcements"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.class_members
      WHERE class_id = announcements.class_id AND student_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

-- ============================================================================
-- LECTURES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage all lectures" ON public.lectures;
DROP POLICY IF EXISTS "Teachers can manage lectures for their classes" ON public.lectures;
DROP POLICY IF EXISTS "Students can view lectures for their classes" ON public.lectures;

-- Admin policy
CREATE POLICY "Admins can manage lectures"
  ON public.lectures FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Teacher policies
CREATE POLICY "Teachers can manage own lectures"
  ON public.lectures FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = lectures.class_id AND teacher_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = lectures.class_id AND teacher_id = auth.uid()
    )
  );

-- Student policy
CREATE POLICY "Students can view class lectures"
  ON public.lectures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.class_members
      WHERE class_id = lectures.class_id AND student_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'student'
    )
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
