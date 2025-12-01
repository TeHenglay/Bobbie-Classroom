import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Spinner } from '../../components';
import { Layout } from '../../components/Layout';
import AssignmentCard from '@/components/AssignmentCard';

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

export const StudentClassPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeTab, setActiveTab] = useState<'stream' | 'assignment' | 'people'>('stream');
  const [assignmentTab, setAssignmentTab] = useState<'Up Coming' | 'Past Due' | 'Completed'>('Up Coming');
  const [loading, setLoading] = useState(true);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Get color based on class ID (consistent with dashboard)
  const getClassColor = (classId: string) => {
    const colors = [
      { from: 'from-red-600', to: 'to-red-700', bg: 'bg-red-600' },
      { from: 'from-indigo-600', to: 'to-indigo-700', bg: 'bg-indigo-600' },
      { from: 'from-blue-600', to: 'to-blue-700', bg: 'bg-blue-600' },
      { from: 'from-green-600', to: 'to-green-700', bg: 'bg-green-600' },
      { from: 'from-purple-600', to: 'to-purple-700', bg: 'bg-purple-600' },
      { from: 'from-pink-600', to: 'to-pink-700', bg: 'bg-pink-600' }
    ];
    // Use a simple hash of the classId for consistency
    const hash = classId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

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
        <div className={`bg-gradient-to-r ${classDetails.id ? getClassColor(classDetails.id).from : 'from-primary-600'} ${classDetails.id ? getClassColor(classDetails.id).to : 'to-primary-700'} rounded-xl shadow-lg overflow-hidden`}>
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
              onClick={() => setActiveTab('assignment')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'assignment'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Assignment
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          <div className="lg:col-span-3 space-y-6">
            {/* Stream Tab */}
            {activeTab === 'stream' && (

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-0">

                {/* <!-- Card --> */}
                <Card className="p-2 shadow-none">
                  <div className=" bg-white">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-yellow-400 flex items-center justify-center text-white font-bold">
                            J
                        </div>
                        <div>
                            <p className="font-semibold">Meow Meow</p>
                            <p className="text-sm text-gray-500">Yesterday</p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-700 mt-3">
                        Please complete the Vocabulary section on pages 16–17 about clothes and fashion
                        parts a–e, and also the attached worksheet before class on Monday.
                    </p>

                    {/* <!-- Attachment Placeholder --> */}
                    <div className="w-full h-28 bg-gray-200 rounded-md mt-4"></div>

                    {/* <!-- Footer --> */}
                    <div className="mt-3 flex items-center gap-2 text-blue-600 text-sm cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10a2 2 0 012-2h2m2-4h6m-6 0a2 2 0 00-2 2v2h10V6a2 2 0 00-2-2m-6 0h6" />
                        </svg>
                        Add comments
                    </div>
                  </div>
                </Card>

                <Card className="p-2 shadow-none">
                  <div className=" bg-white">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-yellow-400 flex items-center justify-center text-white font-bold">
                            J
                        </div>
                        <div>
                            <p className="font-semibold">Meow Meow</p>
                            <p className="text-sm text-gray-500">Yesterday</p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-700 mt-3">
                        Please complete the Vocabulary section on pages 16–17 about clothes and fashion
                        parts a–e, and also the attached worksheet before class on Monday.
                    </p>

                    {/* <!-- Attachment Placeholder --> */}
                    <div className="w-full h-28 bg-gray-200 rounded-md mt-4"></div>

                    {/* <!-- Footer --> */}
                    <div className="mt-3 flex items-center gap-2 text-blue-600 text-sm cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10a2 2 0 012-2h2m2-4h6m-6 0a2 2 0 00-2 2v2h10V6a2 2 0 00-2-2m-6 0h6" />
                        </svg>
                        Add comments
                    </div>
                  </div>
                </Card>
              </div>

            )}

            {/* Classwork Tab */}
            {activeTab === 'assignment' && (
              <Card className="p-0 shadow-none border-0">
                <nav className="flex mb-6 ">
                  {["Up Coming", "Past Due", "Completed"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setAssignmentTab(tab as any)}
                      className={`
                        bg-gray-100 px-6 py-3 text-sm font-medium transition rounded-xl me-3
                        ${
                          assignmentTab === tab
                            ? "bg-purple-200 text-purple-700"
                            : "text-gray-600 hover:bg-gray-100"
                        }
                      `}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>

                {/* Filter assignments based on tab */}
                {(() => {
                  const now = new Date();
                  let filteredAssignments: Assignment[] = [];

                  if (assignmentTab === 'Up Coming') {
                    // Upcoming: not submitted and not past due
                    filteredAssignments = assignments.filter(assignment => {
                      const submission = submissions.find(s => s.assignment_id === assignment.id);
                      const dueDate = new Date(assignment.due_date);
                      return !submission && dueDate >= now;
                    });
                  } else if (assignmentTab === 'Past Due') {
                    // Past Due: not submitted or submitted late and past due date
                    filteredAssignments = assignments.filter(assignment => {
                      const submission = submissions.find(s => s.assignment_id === assignment.id);
                      const dueDate = new Date(assignment.due_date);
                      return dueDate < now && (!submission || submission.status === 'late') && submission?.status !== 'graded';
                    });
                  } else if (assignmentTab === 'Completed') {
                    // Completed: graded assignments
                    filteredAssignments = assignments.filter(assignment => {
                      const submission = submissions.find(s => s.assignment_id === assignment.id);
                      return submission?.status === 'graded';
                    });
                  }

                  return filteredAssignments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <svg className="w-44 h-44 text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h2 className="text-xl font-semibold text-gray-700">
                        No {assignmentTab.toLowerCase()} assignments
                      </h2>
                      <p className="text-gray-500 text-sm mt-2 text-center max-w-md">
                        {assignmentTab === 'Up Coming' && 'You have no upcoming assignments at the moment.'}
                        {assignmentTab === 'Past Due' && 'Great! You have no past due assignments.'}
                        {assignmentTab === 'Completed' && 'No graded assignments yet.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredAssignments.map((assignment) => {
                        const submission = submissions.find(s => s.assignment_id === assignment.id);
                        const dueDate = new Date(assignment.due_date);
                        const createdDate = new Date(assignment.created_at);
                        const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
                        const monthsSinceCreated = Math.floor(daysSinceCreated / 30);
                        
                        const timeAgo = monthsSinceCreated > 0 
                          ? `${monthsSinceCreated} month${monthsSinceCreated > 1 ? 's' : ''} ago`
                          : daysSinceCreated > 0 
                            ? `${daysSinceCreated} day${daysSinceCreated > 1 ? 's' : ''} ago`
                            : 'Today';

                        return (
                          <Link
                            key={assignment.id}
                            to={`/student/class/${classId}/assignment/${assignment.id}`}
                            className="block"
                          >
                            <AssignmentCard
                              title={assignment.title}
                              subject={classDetails?.name || ''}
                              dueTime={dueDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              points={assignment.max_score}
                              createdAt={timeAgo}
                              score={submission?.score}
                            />
                          </Link>
                        );
                      })}
                    </div>
                  );
                })()}
              </Card>
            )}

           
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
