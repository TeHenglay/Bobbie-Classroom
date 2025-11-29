export type UserRole = 'admin' | 'teacher' | 'student';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export interface Class {
  id: string;
  name: string;
  section?: string;
  description: string;
  code: string;
  teacher_id: string;
  created_at: string;
  teacher?: Profile;
}

export interface ClassMember {
  id: string;
  class_id: string;
  student_id: string;
  joined_at: string;
  student?: Profile;
  class?: Class;
}

export interface Assignment {
  id: string;
  class_id: string;
  title: string;
  description: string;
  due_date: string;
  max_score: number;
  created_by: string;
  created_at: string;
  class?: Class;
  creator?: Profile;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  content?: string;
  file_url?: string;
  submitted_at: string;
  score?: number;
  feedback?: string;
  graded_at?: string;
  graded_by?: string;
  assignment?: Assignment;
  student?: Profile;
  grader?: Profile;
}

export interface Announcement {
  id: string;
  class_id: string;
  title: string;
  message: string;
  created_by: string;
  created_at: string;
  class?: Class;
  creator?: Profile;
}
