-- Enable Row Level Security (RLS) on all tables
-- Run this in your Supabase SQL Editor

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on classes table
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Enable RLS on class_members table
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

-- Enable RLS on assignments table
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on submissions table
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on announcements table
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Enable RLS on lectures table
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'classes', 'class_members', 'assignments', 'submissions', 'announcements', 'lectures')
ORDER BY tablename;
