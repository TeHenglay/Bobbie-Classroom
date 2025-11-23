import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSearch } from '../../contexts/SearchContext';
import { Layout } from '../../components/Layout';
import { Card, Spinner } from '../../components';
import type { Assignment, Class } from '../../types';

interface AssignmentWithSubmission extends Assignment {
  submission?: {
    id: string;
    score?: number;
    submitted_at: string;
  };
}

interface ClassWithAssignments extends Class {
  assignments: AssignmentWithSubmission[];
}

export const AssignmentsPage: React.FC = () => {
  const { user } = useAuth();
  const { searchTerm } = useSearch();
  const [classesWithAssignments, setClassesWithAssignments] = useState<ClassWithAssignments[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');

  useEffect(() => {
    if (user?.id) {
      loadAssignments();
    }
  }, [user?.id]);

  const loadAssignments = async () => {
    try {
      setLoading(true);

      // Get all classes the student is enrolled in
      const { data: enrollments, error: enrollError } = await supabase
        .from('class_members')
        .select(`
          class_id,
          classes (
            id,
            name,
            section,
            code,
            teacher:profiles!classes_teacher_id_fkey (
              full_name
            )
          )
        `)
        .eq('student_id', user?.id);

      if (enrollError) throw enrollError;

      if (!enrollments || enrollments.length === 0) {
        setClassesWithAssignments([]);
        return;
      }

      // Get all assignments for these classes with submission status
      const classIds = enrollments.map(e => e.class_id);
      
      const { data: assignments, error: assignError } = await supabase
        .from('assignments')
        .select(`
          id,
          class_id,
          title,
          description,
          due_date,
          max_score,
          created_at,
          created_by,
          submissions (
            id,
            score,
            submitted_at,
            student_id
          )
        `)
        .in('class_id', classIds)
        .order('due_date', { ascending: true });

      if (assignError) throw assignError;

      // Group assignments by class
      const grouped: ClassWithAssignments[] = enrollments.map(enrollment => {
        const classData = enrollment.classes as any;
        const classAssignments = (assignments || [])
          .filter(a => a.class_id === enrollment.class_id)
          .map(assignment => {
            const submission = (assignment.submissions as any[])?.find(
              s => s.student_id === user?.id
            );
            return {
              ...assignment,
              submission: submission || undefined,
              class: classData
            };
          });

        return {
          ...classData,
          assignments: classAssignments
        };
      });

      // Filter out classes with no assignments
      setClassesWithAssignments(grouped.filter(c => c.assignments.length > 0));
    } catch (error: any) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAssignments = (assignments: AssignmentWithSubmission[]) => {
    switch (filter) {
      case 'pending':
        return assignments.filter(a => !a.submission);
      case 'submitted':
        return assignments.filter(a => a.submission && a.submission.score === null);
      case 'graded':
        return assignments.filter(a => a.submission && a.submission.score !== null);
      default:
        return assignments;
    }
  };

  const isOverdue = (dueDate: string, submission?: any) => {
    if (submission) return false;
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Spinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 bg-indigo-100 p-4 rounded-lg">
          <h1 className="text-3xl font-bold text-gray-900">📚 My Assignments</h1>
          <p className="text-gray-600 mt-2">View and manage all your assignments</p>
          <p className="text-xs text-indigo-600 mt-1">DEBUG: You are on the Assignments Page</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'submitted', label: 'Submitted' },
              { key: 'graded', label: 'Graded' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  filter === tab.key
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Classes with Assignments */}
        {classesWithAssignments.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments</h3>
              <p className="mt-1 text-sm text-gray-500">You don't have any assignments yet.</p>
            </div>
          </Card>
        ) : (() => {
          // Filter classes and assignments by search term
          const searchFiltered = classesWithAssignments.map(classItem => ({
            ...classItem,
            assignments: classItem.assignments.filter(assignment =>
              assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              assignment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              classItem.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
          })).filter(classItem => classItem.assignments.length > 0);

          if (searchFiltered.length === 0) {
            return (
              <Card>
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try searching with different keywords.</p>
                </div>
              </Card>
            );
          }

          return (
          <div className="space-y-8">
            {searchFiltered.map(classItem => {
              const filteredAssignments = getFilteredAssignments(classItem.assignments);
              
              if (filteredAssignments.length === 0) return null;

              return (
                <div key={classItem.id}>
                  {/* Class Header */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          {classItem.name}
                          {classItem.section && (
                            <span className="text-gray-500 font-normal ml-2">
                              ({classItem.section})
                            </span>
                          )}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          {classItem.teacher?.full_name} • {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Link
                        to={`/student/classes/${classItem.id}`}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        View Class →
                      </Link>
                    </div>
                  </div>

                  {/* Assignments Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAssignments.map(assignment => (
                      <Link
                        key={assignment.id}
                        to={`/student/classes/${assignment.class_id}/assignments/${assignment.id}`}
                        className="block"
                      >
                        <Card className="hover:shadow-lg transition-shadow h-full">
                          <div className="flex flex-col h-full">
                            {/* Assignment Title */}
                            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                              {assignment.title}
                            </h3>

                            {/* Assignment Description */}
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">
                              {assignment.description || 'No description provided'}
                            </p>

                            {/* Due Date & Status */}
                            <div className="space-y-2">
                              <div className={`text-sm font-medium ${
                                isOverdue(assignment.due_date, assignment.submission)
                                  ? 'text-red-600'
                                  : 'text-gray-700'
                              }`}>
                                {formatDate(assignment.due_date)}
                              </div>

                              {/* Status Badge */}
                              <div>
                                {assignment.submission ? (
                                  assignment.submission.score !== null && assignment.submission.score !== undefined ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Graded: {assignment.submission.score}/{assignment.max_score}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      Submitted
                                    </span>
                                  )
                                ) : isOverdue(assignment.due_date, assignment.submission) ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Overdue
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Pending
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Max Score */}
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <span className="text-xs text-gray-500">
                                Max Score: {assignment.max_score}
                              </span>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          );
        })()}
      </div>
    </Layout>
  );
};
