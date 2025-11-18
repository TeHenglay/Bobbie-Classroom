import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button, Spinner } from '../../components';
import { Layout } from '../../components/Layout';

interface ClassDetails {
  id: string;
  name: string;
  section: string;
  description: string;
  code: string;
  teacher_id: string;
  created_at: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  max_score: number;
  created_at: string;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
  created_by: string;
}

interface Submission {
  id: string;
  assignment_id: string;
  grade: number | null;
  status: string;
}

interface ClassMember {
  student_id: string;
  profiles: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface TeacherProfile {
  id: string;
  full_name: string;
  email: string;
}

export const StudentClassPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [classMembers, setClassMembers] = useState<ClassMember[]>([]);
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'stream' | 'classwork' | 'people'>('stream');
  const [loading, setLoading] = useState(true);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (classId) {
      loadClassData();
    }
  }, [classId]);

  const loadClassData = async () => {
    try {
      // Load class details
      const { data: classData } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single();

      if (classData) {
        setClassDetails(classData);
      }

      // Load assignments
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*')
        .eq('class_id', classId)
        .order('due_date', { ascending: true });

      if (assignmentsData) {
        setAssignments(assignmentsData);
      }

      // Load announcements
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      if (announcementsData) {
        setAnnouncements(announcementsData);
      }

      // Load student's submissions
      if (user?.id) {
        const { data: submissionsData } = await supabase
          .from('submissions')
          .select('*')
          .eq('student_id', user.id);

        if (submissionsData) {
          setSubmissions(submissionsData);
        }
      }

      // Load class members with their profiles
      const { data: membersData, error: membersError } = await supabase
        .from('class_members')
        .select('student_id')
        .eq('class_id', classId);

      console.log('Class members raw data:', membersData);
      console.log('Class members error:', membersError);

      if (membersData && membersData.length > 0) {
        // Fetch profiles for each student
        const studentIds = membersData.map(m => m.student_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', studentIds);

        if (profilesData) {
          const membersWithProfiles = membersData.map(member => ({
            student_id: member.student_id,
            profiles: profilesData.find(p => p.id === member.student_id)
          }));
          setClassMembers(membersWithProfiles as any);
        }
      }

      // Load teacher profile
      if (classData?.teacher_id) {
        const { data: teacherData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', classData.teacher_id)
          .single();

        if (teacherData) {
          setTeacher(teacherData);
        }
      }
    } catch (error) {
      console.error('Error loading class data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveClass = async () => {
    setLeaving(true);
    try {
      if (!user?.id || !classId) {
        throw new Error('Missing user or class information');
      }

      const { error } = await supabase
        .from('class_members')
        .delete()
        .eq('class_id', classId)
        .eq('student_id', user.id);

      if (error) throw error;

      navigate('/student/dashboard');
    } catch (error) {
      console.error('Error leaving class:', error);
      alert('Failed to leave class. Please try again.');
    } finally {
      setLeaving(false);
      setShowLeaveModal(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getSubmissionStatus = (assignmentId: string) => {
    const submission = submissions.find(s => s.assignment_id === assignmentId);
    if (!submission) {
      return { status: 'Not submitted', color: 'gray' };
    }
    if (submission.status === 'graded') {
      return { status: `Graded (${submission.grade} pts)`, color: 'green' };
    }
    if (submission.status === 'late') {
      return { status: 'Submitted (Late)', color: 'red' };
    }
    return { status: 'Submitted', color: 'blue' };
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!classDetails) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Class not found</h2>
          <Link to="/student/dashboard" className="text-primary-600 hover:underline mt-4 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Class Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 text-white">
            <div className="flex justify-between items-start mb-4">
              <Link to="/student/dashboard" className="text-white/80 hover:text-white inline-flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </Link>
              <button
                onClick={() => setShowLeaveModal(true)}
                className="inline-flex items-center px-4 py-2 border border-white/30 rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Leave Class
              </button>
            </div>
            <h1 className="text-4xl font-bold mb-2">{classDetails.name}</h1>
            {classDetails.section && (
              <p className="text-xl text-white/90 mb-4">{classDetails.section}</p>
            )}
            <p className="text-white/80 mb-4">{classDetails.description}</p>
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-sm text-white/80 mr-2">Class Code:</span>
              <span className="text-xl font-mono font-bold">{classDetails.code}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('stream')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'stream'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Stream
            </button>
            <button
              onClick={() => setActiveTab('classwork')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'classwork'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Classwork
            </button>
            <button
              onClick={() => setActiveTab('people')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'people'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              People
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Stream Tab */}
            {activeTab === 'stream' && (
              <>
                {/* Upcoming Assignments */}
                {assignments.length > 0 && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming</h3>
                    <div className="space-y-3">
                      {assignments.slice(0, 3).map((assignment) => {
                        const status = getSubmissionStatus(assignment.id);
                        return (
                          <Link
                            key={assignment.id}
                            to={`/student/class/${classId}/assignment/${assignment.id}`}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center flex-1">
                              <div className="p-2 bg-primary-100 rounded-lg mr-3">
                                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{assignment.title}</p>
                                <p className="text-sm text-gray-500">Due {formatDate(assignment.due_date)}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-700`}>
                              {status.status}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {/* Announcements */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Announcements</h3>
                  {announcements.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                      <p>No announcements yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {announcements.map((announcement) => (
                        <div key={announcement.id} className="border-l-4 border-primary-600 pl-4 py-2">
                          <h4 className="font-semibold text-gray-900 mb-1">{announcement.title}</h4>
                          <p className="text-gray-600 mb-2">{announcement.message}</p>
                          <p className="text-xs text-gray-500">{formatDate(announcement.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            )}

            {/* Classwork Tab */}
            {activeTab === 'classwork' && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Assignments</h3>
                {assignments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>No assignments yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignments.map((assignment) => {
                      const status = getSubmissionStatus(assignment.id);
                      return (
                        <Link
                          key={assignment.id}
                          to={`/student/class/${classId}/assignment/${assignment.id}`}
                          className="block p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-primary-300 transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start flex-1">
                              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-1">{assignment.title}</h4>
                                <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span>Due: {formatDate(assignment.due_date)}</span>
                                  <span>•</span>
                                  <span>{assignment.max_score} points</span>
                                </div>
                              </div>
                            </div>
                            <div className="ml-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-700 whitespace-nowrap`}>
                                {status.status}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </Card>
            )}

            {/* People Tab */}
            {activeTab === 'people' && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Class Members</h3>
                <div className="space-y-6">
                  {/* Teacher Section */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Teacher</h4>
                    {teacher ? (
                      <div className="flex items-center p-3 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border border-primary-200">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-semibold">
                          {teacher.full_name?.charAt(0).toUpperCase() || 'T'}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{teacher.full_name || 'Teacher'}</p>
                          <p className="text-sm text-gray-600">{teacher.email}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                          T
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">Teacher</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Students Section */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Students ({classMembers.length})
                    </h4>
                    {classMembers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No students enrolled yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {classMembers.map((member) => (
                          <div key={member.student_id} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {member.profiles?.full_name?.charAt(0).toUpperCase() || 'S'}
                            </div>
                            <div className="ml-3">
                              <p className="font-medium text-gray-900">{member.profiles?.full_name || 'Student'}</p>
                              <p className="text-sm text-gray-500">{member.profiles?.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Code</h3>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-mono font-bold text-primary-600 mb-2">{classDetails.code}</p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Assignments</span>
                  <span className="font-semibold text-gray-900">{assignments.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Submitted</span>
                  <span className="font-semibold text-gray-900">
                    {submissions.filter(s => assignments.some(a => a.id === s.assignment_id)).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Graded</span>
                  <span className="font-semibold text-gray-900">
                    {submissions.filter(s => s.status === 'graded' && assignments.some(a => a.id === s.assignment_id)).length}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Leave Class Confirmation Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="ml-4 text-xl font-bold text-gray-900">Leave Class</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to leave <span className="font-semibold">{classDetails.name}</span>? 
              You will lose access to all class materials and assignments.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLeaveModal(false)}
                disabled={leaving}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveClass}
                disabled={leaving}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {leaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Leaving...
                  </>
                ) : (
                  'Leave Class'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
