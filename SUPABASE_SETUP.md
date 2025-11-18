# Supabase Setup Guide for ClassLab

This guide will walk you through setting up the Supabase backend for the ClassLab classroom management platform.

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Enter your project details:
   - **Project Name**: ClassLab
   - **Database Password**: (choose a strong password)
   - **Region**: (select closest to your location)
4. Click "Create new project"
5. Wait for the project to be provisioned

## 2. Get Your API Keys

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key
3. Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 3. Database Schema Setup

Go to the **SQL Editor** in your Supabase dashboard and run the following SQL commands:

### 3.1 Create Tables

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classes table
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  section TEXT,
  description TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Class members table
CREATE TABLE class_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

-- Assignments table
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_score INTEGER NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submissions table
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  file_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score INTEGER,
  feedback TEXT,
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(assignment_id, student_id)
);

-- Announcements table
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_classes_teacher ON classes(teacher_id);
CREATE INDEX idx_class_members_student ON class_members(student_id);
CREATE INDEX idx_class_members_class ON class_members(class_id);
CREATE INDEX idx_assignments_class ON assignments(class_id);
CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_announcements_class ON announcements(class_id);
```

## 4. Row Level Security (RLS) Policies

Enable RLS on all tables and create policies:

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Classes policies
CREATE POLICY "Teachers can view their own classes" 
  ON classes FOR SELECT 
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can create classes" 
  ON classes FOR INSERT 
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update their own classes" 
  ON classes FOR UPDATE 
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their own classes" 
  ON classes FOR DELETE 
  USING (teacher_id = auth.uid());

CREATE POLICY "Students can view classes they are enrolled in" 
  ON classes FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM class_members 
      WHERE class_members.class_id = classes.id 
      AND class_members.student_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all classes" 
  ON classes FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Class members policies
CREATE POLICY "Students can view their own enrollments" 
  ON class_members FOR SELECT 
  USING (student_id = auth.uid());

CREATE POLICY "Students can create enrollments for themselves" 
  ON class_members FOR INSERT 
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can view members of their classes" 
  ON class_members FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = class_members.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can remove students from their classes" 
  ON class_members FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = class_members.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all class members" 
  ON class_members FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Assignments policies
CREATE POLICY "Teachers can manage assignments for their classes" 
  ON assignments FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = assignments.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view assignments for their classes" 
  ON assignments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM class_members 
      WHERE class_members.class_id = assignments.class_id 
      AND class_members.student_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all assignments" 
  ON assignments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Submissions policies
CREATE POLICY "Students can view their own submissions" 
  ON submissions FOR SELECT 
  USING (student_id = auth.uid());

CREATE POLICY "Students can create their own submissions" 
  ON submissions FOR INSERT 
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own submissions" 
  ON submissions FOR UPDATE 
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view submissions for their assignments" 
  ON submissions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      JOIN classes ON classes.id = assignments.class_id
      WHERE assignments.id = submissions.assignment_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can grade submissions for their assignments" 
  ON submissions FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM assignments
      JOIN classes ON classes.id = assignments.class_id
      WHERE assignments.id = submissions.assignment_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all submissions" 
  ON submissions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Announcements policies
CREATE POLICY "Teachers can manage announcements for their classes" 
  ON announcements FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE classes.id = announcements.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view announcements for their classes" 
  ON announcements FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM class_members 
      WHERE class_members.class_id = announcements.class_id 
      AND class_members.student_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all announcements" 
  ON announcements FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

## 5. Storage Setup

1. Go to **Storage** in your Supabase dashboard
2. Click "Create bucket"
3. Create a bucket named `assignment-submissions`
4. Set it as **Private**
5. Click "Create bucket"

### Storage Policies

Go to the bucket policies and add:

```sql
-- Allow students to upload their own files
CREATE POLICY "Students can upload their submissions"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assignment-submissions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow students to view their own files
CREATE POLICY "Students can view their own submissions"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'assignment-submissions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow teachers to view files for their assignments
CREATE POLICY "Teachers can view submissions for their classes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'assignment-submissions' 
  AND EXISTS (
    SELECT 1 FROM classes
    WHERE classes.teacher_id = auth.uid()
    AND classes.id::text = (storage.foldername(name))[1]
  )
);

-- Allow admins to view all files
CREATE POLICY "Admins can view all submissions"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'assignment-submissions' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

## 6. Authentication Setup

1. Go to **Authentication** > **Providers**
2. Enable **Email** provider
3. Configure email settings (optional)
4. Go to **URL Configuration**
5. Add your site URL: `http://localhost:5173` (for development)
6. Add redirect URLs: `http://localhost:5173/**`

## 7. Create First Admin User

After setting up, register your first user through the app, then run this SQL to make them an admin:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'your-user-id-here';
```

You can find the user ID in **Authentication** > **Users**.

## 8. Test the Setup

1. Start your development server: `npm run dev`
2. Register a new account
3. Try logging in
4. Test creating classes (as teacher)
5. Test joining classes (as student)

## Troubleshooting

### Connection Issues
- Verify your `.env` file has the correct URL and key
- Check that the environment variables are loaded (restart dev server)

### Permission Denied Errors
- Check RLS policies are correctly applied
- Verify user role is set correctly in the profiles table
- Check the browser console for detailed error messages

### Storage Issues
- Ensure the bucket is created and named correctly
- Verify storage policies are applied
- Check file path format: `classId/assignmentId/studentId/filename`

## Next Steps

Once the Supabase backend is set up:
1. Configure your `.env` file with the API keys
2. Run the application
3. Create test users with different roles
4. Test all features (create classes, assignments, submissions, etc.)

For production deployment:
- Update URL configuration with your production domain
- Set up proper email provider
- Consider rate limiting
- Enable 2FA for admin accounts
- Set up database backups
