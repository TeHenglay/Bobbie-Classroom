import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card, Button } from '../../components';

interface ClassStats {
  id: string;
  name: string;
  section: string;
  description: string;
  code: string;
  teacher_name: string;
  teacher_email: string;
  student_count: number;
  assignment_count: number;
  announcement_count: number;
  created_at: string;
}

export const AdminClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<ClassStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadClassStats();
  }, []);

  const loadClassStats = async () => {
    try {
      setLoading(true);
      
      // Get all classes with teacher info
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          section,
          description,
          code,
          created_at,
          teacher:profiles!classes_teacher_id_fkey(
            full_name,
            id
          )
        `)
        .order('created_at', { ascending: false });

      if (classesError) throw classesError;

      // Get student counts for each class
      const { data: memberCounts, error: memberError } = await supabase
        .from('class_members')
        .select('class_id');

      if (memberError) throw memberError;

      // Get assignment counts for each class
      const { data: assignmentCounts, error: assignmentError } = await supabase
        .from('assignments')
        .select('class_id');

      if (assignmentError) throw assignmentError;

      // Get announcement counts for each class
      const { data: announcementCounts, error: announcementError } = await supabase
        .from('announcements')
        .select('class_id');

      if (announcementError) throw announcementError;

      // Get teacher emails
      const teacherIds = classesData?.map((c: any) => c.teacher?.id).filter(Boolean) || [];
      const { data: usersData } = await supabase.auth.admin.listUsers();
      
      const teacherEmails: Record<string, string> = {};
      usersData?.users.forEach(user => {
        if (teacherIds.includes(user.id)) {
          teacherEmails[user.id] = user.email || '';
        }
      });

      // Combine all data
      const stats: ClassStats[] = (classesData || []).map((classItem: any) => {
        const studentCount = memberCounts?.filter(m => m.class_id === classItem.id).length || 0;
        const assignmentCount = assignmentCounts?.filter(a => a.class_id === classItem.id).length || 0;
        const announcementCount = announcementCounts?.filter(a => a.class_id === classItem.id).length || 0;

        return {
          id: classItem.id,
          name: classItem.name,
          section: classItem.section || '',
          description: classItem.description,
          code: classItem.code,
          teacher_name: classItem.teacher?.full_name || 'Unknown',
          teacher_email: teacherEmails[classItem.teacher?.id] || '',
          student_count: studentCount,
          assignment_count: assignmentCount,
          announcement_count: announcementCount,
          created_at: classItem.created_at,
        };
      });

      setClasses(stats);
    } catch (err) {
      console.error('Error loading class stats:', err);
      setError('Failed to load class statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Class Statistics</h1>
              <p className="text-gray-600 mt-1">Overview of all classes in the system</p>
            </div>
            <Link to="/admin/dashboard">
              <Button variant="outline">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600">Loading class statistics...</p>
            </div>
          </div>
        ) : error ? (
          <Card className="p-6">
            <div className="text-center text-red-600">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>{error}</p>
            </div>
          </Card>
        ) : classes.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Classes Yet</h3>
              <p className="text-gray-600">No classes have been created in the system</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Classes</p>
                    <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {classes.reduce((sum, c) => sum + c.student_count, 0)}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Assignments</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {classes.reduce((sum, c) => sum + c.assignment_count, 0)}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Announcements</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {classes.reduce((sum, c) => sum + c.announcement_count, 0)}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Class List */}
            <div className="space-y-4">
              {classes.map((classItem) => (
                <Card key={classItem.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {classItem.name}
                        </h3>
                        {classItem.section && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                            {classItem.section}
                          </span>
                        )}
                        <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full font-mono">
                          {classItem.code}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{classItem.description}</p>
                      
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="font-medium">{classItem.teacher_name}</span>
                          {classItem.teacher_email && (
                            <span className="ml-2 text-gray-500">({classItem.teacher_email})</span>
                          )}
                        </div>
                        
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Created {formatDate(classItem.created_at)}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-8 ml-8">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{classItem.student_count}</div>
                        <div className="text-sm text-gray-600">Students</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">{classItem.assignment_count}</div>
                        <div className="text-sm text-gray-600">Assignments</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-orange-600">{classItem.announcement_count}</div>
                        <div className="text-sm text-gray-600">Announcements</div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
