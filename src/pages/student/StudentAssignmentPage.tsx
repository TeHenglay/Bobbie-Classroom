import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
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
  submission_text: string;
  submission_file_url: string | null;
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
  status: 'submitted' | 'graded' | 'late';
}

export const StudentAssignmentPage: React.FC = () => {
  const { classId, assignmentId } = useParams<{ classId: string; assignmentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (assignmentId && user?.id) {
      loadAssignmentData();
    }
  }, [assignmentId, user?.id]);

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

      // Check if student has already submitted
      const { data: submissionData } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', user?.id)
        .maybeSingle();

      if (submissionData) {
        setSubmission(submissionData);
        setSubmissionText(submissionData.submission_text || '');
      }
    } catch (error) {
      console.error('Error loading assignment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setAttachedFiles([...attachedFiles, ...files]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (!user?.id || !assignmentId) {
        throw new Error('Missing user or assignment information');
      }

      if (!submissionText.trim()) {
        throw new Error('Please enter your answer before submitting');
      }

      const dueDate = new Date(assignment!.due_date);
      const now = new Date();
      const status = now > dueDate ? 'late' : 'submitted';

      if (submission) {
        // Update existing submission
        const { error: updateError } = await supabase
          .from('submissions')
          .update({
            submission_text: submissionText,
            submitted_at: new Date().toISOString(),
            status: status
          })
          .eq('id', submission.id);

        if (updateError) {
          console.error('Update error:', updateError);
          throw new Error(`Failed to update: ${updateError.message}`);
        }
        setSuccess('Your work has been updated successfully!');
      } else {
        // Create new submission
        const { data, error: insertError } = await supabase
          .from('submissions')
          .insert([
            {
              assignment_id: assignmentId,
              student_id: user.id,
              submission_text: submissionText,
              submitted_at: new Date().toISOString(),
              status: status
            },
          ])
          .select()
          .single();

        if (insertError) {
          console.error('Insert error:', insertError);
          throw new Error(`Failed to submit: ${insertError.message}`);
        }
        if (data) {
          setSubmission(data);
        }
        setSuccess('Your work has been submitted successfully!');
      }

      await loadAssignmentData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error submitting assignment:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOverdue = () => {
    if (!assignment) return false;
    return new Date() > new Date(assignment.due_date);
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
          <Button onClick={() => navigate(`/student/class/${classId}`)} className="mt-4">
            Back to Class
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Top Bar with Back Button */}
        <div className="mb-6">
          <Link 
            to={`/student/dashboard`}
            className="text-primary-600 hover:text-primary-700 inline-flex items-center text-sm font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Assignment Header Card */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Title Section with colored header */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6">
                <h1 className="text-3xl font-bold text-white mb-2">{assignment.title}</h1>
                <div className="flex items-center space-x-4 text-white/90 text-sm">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Due {formatDate(assignment.due_date)}
                  </span>
                  <span>•</span>
                  <span>{assignment.max_score} points</span>
                </div>
              </div>

              {/* Instructions Section */}
              {assignment.description && (
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h3>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{assignment.description}</p>
                </div>
              )}
            </div>

            {/* Grade Display (if graded) */}
            {submission?.status === 'graded' && submission.grade !== null && (
              <div className="bg-white border-2 border-green-200 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-green-800 mb-1">YOUR GRADE</h3>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-5xl font-bold text-green-600">{submission.grade}</span>
                        <span className="text-2xl text-gray-600">/ {assignment.max_score}</span>
                      </div>
                    </div>
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  {submission.feedback && (
                    <div className="mt-6 p-4 bg-white rounded-lg border border-green-200">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        Teacher Feedback
                      </h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{submission.feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Your Work Section */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Your work</h3>
              </div>

              <div className="p-6">
                {submission?.status === 'graded' ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {submission.submission_text || 'No text submission'}
                      </p>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Turned in {formatDate(submission.submitted_at)}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm flex items-start">
                        <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm flex items-start">
                        <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {success}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Answer
                      </label>
                      <textarea
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        rows={12}
                        placeholder="Type your answer here..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none text-base"
                      />
                    </div>

                    {/* File Attachments */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Attachments (optional)
                      </label>
                      
                      {/* Attached Files Display */}
                      {attachedFiles.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {attachedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeAttachment(index)}
                                className="flex-shrink-0 ml-3 text-red-600 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add File Button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center space-x-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors w-full justify-center text-gray-600 hover:text-primary-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="text-sm font-medium">Add file</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        multiple
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                      />
                    </div>

                    {submission && (
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Last submitted {formatDate(submission.submitted_at)}
                      </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/student/dashboard')}
                        className="px-6"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        isLoading={submitting}
                        disabled={submitting}
                        className="bg-primary-600 hover:bg-primary-700 px-8"
                      >
                        {submitting ? 'Submitting...' : submission ? 'Resubmit' : 'Submit'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Status Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Status</h3>
              {submission?.status === 'graded' ? (
                <div className="flex items-center text-green-600">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Graded</span>
                </div>
              ) : submission?.status === 'submitted' ? (
                <div className="flex items-center text-blue-600">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Turned in</span>
                </div>
              ) : isOverdue() ? (
                <div className="flex items-center text-red-600">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Missing</span>
                </div>
              ) : (
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Assigned</span>
                </div>
              )}
            </div>

            {/* Due Date Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Due</h3>
              <p className="text-gray-900 font-medium">{formatDate(assignment.due_date)}</p>
              {isOverdue() && !submission && (
                <p className="text-red-600 text-sm mt-1">Overdue</p>
              )}
            </div>

            {/* Points Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Points</h3>
              <p className="text-2xl font-bold text-primary-600">{assignment.max_score}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
