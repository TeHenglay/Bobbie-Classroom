-- Disable Row Level Security on all tables for development/testing
-- This allows full access to all data without authentication checks

-- Profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Classes table
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;

-- Class members table
ALTER TABLE class_members DISABLE ROW LEVEL SECURITY;

-- Assignments table
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;

-- Submissions table
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;

-- Announcements table
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'classes', 'class_members', 'assignments', 'submissions', 'announcements');
