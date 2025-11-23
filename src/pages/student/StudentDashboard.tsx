import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSearch } from '../../contexts/SearchContext';
import type { Class, Assignment, ClassMember } from '../../types';
import { Card, Spinner, Button } from '../../components';
import { Layout } from '../../components/Layout';

interface ClassWithTeacher extends Class {
  teacher?: {
    full_name: string;
    avatar_url?: string;
  };
  studentCount?: number;
  classmates?: Array<{
    full_name: string;
    avatar_url?: string;
  }>;
}

interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  score: number | null;
  feedback: string | null;
  status: string;
  submitted_at: string;
}

interface GradedAssignment extends Assignment {
  submission?: Submission;
}

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { searchTerm } = useSearch();
  const [classes, setClasses] = useState<ClassWithTeacher[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>([]);
  const [gradedAssignments, setGradedAssignments] = useState<GradedAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Load enrolled classes with teacher info
      const { data: memberData } = await supabase
        .from('class_members')
        .select(`
          *,
          class:classes(
            *,
            teacher:profiles!classes_teacher_id_fkey(
              full_name,
              avatar_url
            )
          )
        `)
        .eq('student_id', user.id);

      if (memberData) {
        const enrolledClasses = memberData.map((m: any) => m.class).filter(Boolean) as ClassWithTeacher[];
        
        // Fetch classmates for each class
        const classesWithClassmates = await Promise.all(
          enrolledClasses.map(async (classItem) => {
            const { data: members } = await supabase
              .from('class_members')
              .select(`
                student_id,
                profiles:student_id (
                  full_name,
                  avatar_url
                )
              `)
              .eq('class_id', classItem.id)
              .neq('student_id', user.id)
              .limit(3);
            
            const { count } = await supabase
              .from('class_members')
              .select('*', { count: 'exact', head: true })
              .eq('class_id', classItem.id);
            
            return {
              ...classItem,
              studentCount: count || 0,
              classmates: members?.map((m: any) => m.profiles).filter(Boolean) || []
            };
          })
        );
        
        setClasses(classesWithClassmates);

        // Load upcoming assignments
        const classIds = enrolledClasses.map((c) => c.id);
        if (classIds.length > 0) {
          const { data: assignmentData } = await supabase
            .from('assignments')
            .select('*, class:classes(*)')
            .in('class_id', classIds)
            .gte('due_date', new Date().toISOString())
            .order('due_date', { ascending: true })
            .limit(5);

          if (assignmentData) {
            setUpcomingAssignments(assignmentData);
          }

          // Load graded assignments
          const { data: submissionsData } = await supabase
            .from('submissions')
            .select('*')
            .eq('student_id', user.id)
            .eq('status', 'graded')
            .order('submitted_at', { ascending: false })
            .limit(5);

          if (submissionsData && submissionsData.length > 0) {
            // Get assignment details for graded submissions
            const assignmentIds = submissionsData.map(s => s.assignment_id);
            const { data: gradedAssignmentData } = await supabase
              .from('assignments')
              .select('*, class:classes(*)')
              .in('id', assignmentIds);

            if (gradedAssignmentData) {
              const gradedWithSubmissions = gradedAssignmentData.map(assignment => ({
                ...assignment,
                submission: submissionsData.find(s => s.assignment_id === assignment.id)
              }));
              setGradedAssignments(gradedWithSubmissions);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Spinner size="lg" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="animate-slide-in">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Welcome Back! 👋
          </h1>
          <p className="mt-2 text-gray-600">Here's your overview for today.</p>
        </div>

        {/* Graded Assignments */}
        {gradedAssignments.length > 0 && (
          <Card title="✅ Recently Graded" className="animate-slide-in">
            <div className="space-y-3">
              {gradedAssignments.map((assignment) => (
                <Link
                  key={assignment.id}
                  to={`/student/class/${assignment.class_id}/assignment/${assignment.id}`}
                  className="block p-5 border-2 border-green-100 bg-green-50/50 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all duration-200 group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                        {assignment.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        {assignment.class?.name}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="flex items-baseline space-x-1">
                        <span className="text-3xl font-bold text-green-600">{assignment.submission?.score}</span>
                        <span className="text-lg text-gray-600">/ {assignment.max_score}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.round((assignment.submission?.score || 0) / assignment.max_score * 100)}%
                      </div>
                    </div>
                  </div>
                  {assignment.submission?.feedback && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                      <p className="text-sm text-gray-700 line-clamp-2">{assignment.submission.feedback}</p>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* Upcoming Assignments */}
        <Card title="📝 Upcoming Assignments" className="animate-slide-in">
          {upcomingAssignments.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No upcoming assignments</p>
              <p className="text-gray-400 text-sm mt-1">You're all caught up! 🎉</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAssignments.map((assignment) => (
                <Link
                  key={assignment.id}
                  to={`/student/class/${assignment.class_id}/assignment/${assignment.id}`}
                  className="block p-5 border-2 border-gray-100 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {assignment.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        {assignment.class?.name}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-semibold text-gray-900 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-primary-600 font-medium mt-1">{assignment.max_score} points</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* My Classes */}
        <Card title="📚 My Classes" className="animate-slide-in">
          {classes.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl mb-4">
                <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium mb-2">You're not enrolled in any classes yet</p>
              <p className="text-gray-500 text-sm mb-4">Join a class using a code from your teacher</p>
              <Link to="/student/join-class">
                <Button className="mt-2">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Join Your First Class
                </Button>
              </Link>
            </div>
          ) : (() => {
            const filteredClasses = classes.filter(classItem =>
              classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              classItem.section?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              classItem.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
              classItem.teacher?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            
            return filteredClasses.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                <p className="mt-1 text-sm text-gray-500">Try searching with different keywords.</p>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.map((classItem, index) => {
                const colors = [
                  { bg: 'bg-red-600', border: 'border-red-600' },
                  { bg: 'bg-indigo-600', border: 'border-indigo-600' },
                  { bg: 'bg-blue-600', border: 'border-blue-600' },
                  { bg: 'bg-green-600', border: 'border-green-600' },
                  { bg: 'bg-purple-600', border: 'border-purple-600' },
                  { bg: 'bg-pink-600', border: 'border-pink-600' }
                ];
                // Use class ID hash for consistent color across pages
                const hash = classItem.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const color = colors[hash % colors.length];
                
                return (
                  <Link
                    key={classItem.id}
                    to={`/student/classes/${classItem.id}`}
                    className="block group"
                  >
                    <div className={`${color.bg} rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden border ${color.border}`}>
                      {/* Header with background color */}
                      <div className="px-6 py-4 text-white relative">
                        <h3 className="font-bold text-lg mb-1">{classItem.name}</h3>
                        <p className="text-sm opacity-90">{classItem.section || "Let's Start"}</p>
                        {/* Decorative icon */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
                          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                          </svg>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="px-6 py-4 bg-white bg-opacity-95">
                        {/* Teacher Info */}
                        <div className="flex items-center gap-2 mb-3">
                          {classItem.teacher?.avatar_url ? (
                            <img 
                              src={classItem.teacher.avatar_url} 
                              alt={classItem.teacher.full_name}
                              className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white font-semibold text-sm">
                              {classItem.teacher?.full_name?.charAt(0).toUpperCase() || 'T'}
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm text-gray-600">Teacher: <span className="font-medium text-gray-900">{classItem.teacher?.full_name || 'Unknown'}</span></p>
                          </div>
                          <div className={`w-10 h-10 ${color.bg} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                            {index + 1}
                          </div>
                        </div>
                        
                        {/* Class Code */}
                        <div className="pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-gray-500">Code: <span className="font-mono font-semibold text-gray-900">{classItem.code}</span></p>
                          </div>
                          
                          {/* Classmate Avatars */}
                          <div className="flex items-center gap-2">
                            {classItem.classmates && classItem.classmates.length > 0 ? (
                              <>
                                <div className="flex -space-x-2">
                                  {classItem.classmates.slice(0, 3).map((classmate, idx) => (
                                    classmate.avatar_url ? (
                                      <img
                                        key={idx}
                                        src={classmate.avatar_url}
                                        alt={classmate.full_name}
                                        className="w-8 h-8 rounded-full border-2 border-white object-cover"
                                      />
                                    ) : (
                                      <div
                                        key={idx}
                                        className={`w-8 h-8 rounded-full border-2 border-white ${color.bg} flex items-center justify-center text-white text-xs font-semibold`}
                                      >
                                        {classmate.full_name?.charAt(0).toUpperCase() || 'S'}
                                      </div>
                                    )
                                  ))}
                                </div>
                                <span className="text-xs text-gray-600">
                                  {classItem.studentCount === 1 ? '1 student' : `${classItem.studentCount} students`}
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-gray-500 italic">No other students yet</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            );
          })()}
        </Card>
      </div>
    </Layout>
  );
};
