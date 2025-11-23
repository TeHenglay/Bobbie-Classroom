import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card, Button, Spinner } from '../../components';
import { Layout } from '../../components/Layout';

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  max_score: number;
  created_at: string;
  class_id: string;
}

interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string;
  file_url: string | null;
  submitted_at: string;
  score: number | null;
  feedback: string | null;
  status: 'submitted' | 'graded' | 'late';
  student: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface ClassMember {
  student_id: string;
  profiles: {
    id: string;
    full_name: string;
    email: string;
  };
}

export const AssignmentDetailPage: React.FC = () => {
  const { classId, assignmentId } = useParams<{ classId: string; assignmentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [students, setStudents] = useState<ClassMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradeForm, setGradeForm] = useState({ score: 0, feedback: '' });
  const [saving, setSaving] = useState(false);

  // Determine where we came from
  const fromAssignments = location.state?.from === 'assignments';
  const backPath = fromAssignments ? '/teacher/assignments' : `/teacher/class/${classId}`;
  const backLabel = fromAssignments ? 'Back to Assignments' : 'Back to Class';

  useEffect(() => {
    if (assignmentId && classId) {
      loadAssignmentData();
    }
  }, [assignmentId, classId]);

  const loadAssignmentData = async () => {
    try {
      // Load assignment details
      const { data: assignmentData } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();

      if (assignmentData) {
        setAssignment(assignmentData);
      }

      // Load all students in class
      const { data: studentsData } = await supabase
        .from('class_members')
        .select('student_id')
        .eq('class_id', classId);

      if (studentsData && studentsData.length > 0) {
        const studentIds = studentsData.map(m => m.student_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', studentIds);

        if (profilesData) {
          const membersWithProfiles = studentsData.map(member => ({
            student_id: member.student_id,
            profiles: profilesData.find(p => p.id === member.student_id)
          }));
          setStudents(membersWithProfiles as any);
        }
      }

      // Load submissions
      const { data: submissionsData } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignmentId);

      console.log('Submissions data:', submissionsData);

      if (submissionsData && submissionsData.length > 0) {
        // Get student profiles for submissions
        const submissionStudentIds = submissionsData.map(s => s.student_id);
        const { data: submissionProfiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', submissionStudentIds);

        // Map to expected structure
        const mappedSubmissions = submissionsData.map((sub: any) => ({
          ...sub,
          student: submissionProfiles?.find(p => p.id === sub.student_id)
        }));
        setSubmissions(mappedSubmissions);
        console.log('Mapped submissions:', mappedSubmissions);
      }
    } catch (error) {
      console.error('Error loading assignment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async (submissionId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          score: gradeForm.score,
          feedback: gradeForm.feedback,
          status: 'graded'
        })
        .eq('id', submissionId);

      if (error) throw error;

      await loadAssignmentData();
      setSelectedSubmission(null);
      setGradeForm({ score: 0, feedback: '' });
    } catch (error) {
      console.error('Error grading submission:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSubmissionForStudent = (studentId: string) => {
    return submissions.find(sub => sub.student_id === studentId);
  };

  const getStatusBadge = (submission?: Submission) => {
    if (!submission) {
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Not submitted</span>;
    }
    
    if (submission.status === 'graded') {
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Graded</span>;
    }
    
    if (submission.status === 'late') {
      return <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Late</span>;
    }
    
    return <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Submitted</span>;
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

  if (!assignment) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Assignment not found</h2>
          <Button onClick={() => navigate(backPath)} className="mt-4">
            {backLabel}
          </Button>
        </div>
      </Layout>
    );
  }

  const submittedCount = submissions.length;
  const gradedCount = submissions.filter(s => s.status === 'graded').length;
  const totalStudents = students.length;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <Link 
              to={backPath}
              className="text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center text-sm font-medium"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {backLabel}
            </Link>
            
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{assignment.title}</h1>
                    <p className="text-sm text-gray-500 mt-1">Due: {formatDate(assignment.due_date)}</p>
                  </div>
                </div>
                
                {assignment.description && (
                  <p className="text-gray-600 mb-4 max-w-3xl">{assignment.description}</p>
                )}
              </div>
              
              <div className="text-right">
                <div className="text-3xl font-bold text-primary-600">{assignment.max_score}</div>
                <div className="text-sm text-gray-500">points</div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold text-gray-900">{submittedCount}/{totalStudents}</div>
                <div className="text-sm text-gray-600">Submitted</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{gradedCount}</div>
                <div className="text-sm text-gray-600">Graded</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-400">{totalStudents - submittedCount}</div>
                <div className="text-sm text-gray-600">Not Submitted</div>
              </div>
            </div>
          </div>
        </div>

        {/* Student Submissions List */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Student Work</h2>
          
          {students.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-lg font-medium">No students enrolled yet</p>
              <p className="text-sm mt-2">Students need to join the class first</p>
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => {
                const submission = getSubmissionForStudent(student.student_id);
                
                return (
                  <div
                    key={student.student_id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
                    onClick={() => {
                      if (submission) {
                        setSelectedSubmission(submission);
                        setGradeForm({ 
                          score: submission.score || 0, 
                          feedback: submission.feedback || '' 
                        });
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                          {student.profiles.full_name?.charAt(0).toUpperCase() || 'S'}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{student.profiles.full_name || 'Student'}</h3>
                          <p className="text-sm text-gray-500">{student.profiles.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {submission?.score !== null && (
                          <div className="text-right mr-4">
                            <div className="text-2xl font-bold text-primary-600">{submission.score}</div>
                            <div className="text-xs text-gray-500">/ {assignment.max_score}</div>
                          </div>
                        )}
                        {getStatusBadge(submission)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {selectedSubmission.student.full_name?.charAt(0).toUpperCase() || 'S'}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedSubmission.student.full_name}</h2>
                  <p className="text-sm text-gray-500">Submitted: {formatDate(selectedSubmission.submitted_at)}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedSubmission(null);
                  setGradeForm({ score: 0, feedback: '' });
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Student's Answer */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Student's Answer</h3>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[200px]">
                  {selectedSubmission.content ? (
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedSubmission.content}</p>
                  ) : (
                    <p className="text-gray-400 italic">No answer provided</p>
                  )}
                </div>
                {/* Debug info */}
                <div className="mt-2 text-xs text-gray-500">
                  <details>
                    <summary className="cursor-pointer hover:text-gray-700">Debug: View raw submission data</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(selectedSubmission, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>

              {/* File Attachment */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Attachment</h3>
                {selectedSubmission.file_url ? (
                  <a
                    href={selectedSubmission.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-blue-600 font-medium block">Student's File</span>
                        <span className="text-blue-500 text-sm">Click to view or download</span>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : (
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-gray-500 italic">No file attachment</span>
                  </div>
                )}
              </div>

              {/* Grading Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade & Feedback</h3>
                
                <div className="space-y-4">
                  {/* Grade Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade (out of {assignment.max_score})
                    </label>
                    <input
                      type="number"
                      value={gradeForm.score}
                      onChange={(e) => setGradeForm({ ...gradeForm, score: parseInt(e.target.value) || 0 })}
                      min="0"
                      max={assignment.max_score}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                    />
                  </div>

                  {/* Feedback */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Feedback
                    </label>
                    <textarea
                      value={gradeForm.feedback}
                      onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                      rows={4}
                      placeholder="Provide feedback for the student..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedSubmission(null);
                  setGradeForm({ score: 0, feedback: '' });
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleGradeSubmission(selectedSubmission.id)}
                isLoading={saving}
                disabled={saving}
                className="bg-primary-600 hover:bg-primary-700"
              >
                {saving ? 'Saving...' : 'Save Grade'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
