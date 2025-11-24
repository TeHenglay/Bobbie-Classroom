import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSearch } from '../../contexts/SearchContext';
import { Layout } from '../../components/Layout';
import { Card, Spinner, Modal, Input, Textarea, Button } from '../../components';
import type { Assignment, Class } from '../../types';

interface AssignmentWithClass extends Assignment {
  submissionCount?: number;
  totalStudents?: number;
}

interface ClassWithAssignments extends Class {
  assignments: AssignmentWithClass[];
  studentCount: number;
}

export const AssignmentsListPage: React.FC = () => {
  const { user } = useAuth();
  const { searchTerm } = useSearch();
  const [classesWithAssignments, setClassesWithAssignments] = useState<ClassWithAssignments[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'past'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    due_date: new Date().toISOString().split('T')[0],
    due_time: '12:00',
    max_score: 100,
    class_id: ''
  });

  useEffect(() => {
    if (user?.id) {
      loadAssignments();
    }
  }, [user?.id]);

  useEffect(() => {
    const handleOpenModal = () => setShowCreateModal(true);
    window.addEventListener('openCreateAssignmentModal', handleOpenModal);
    return () => window.removeEventListener('openCreateAssignmentModal', handleOpenModal);
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);

      // Get all classes taught by this teacher
      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user?.id)
        .order('name');

      if (classError) throw classError;

      setAllClasses(classes || []);
      if (classes && classes.length > 0 && !assignmentForm.class_id) {
        setAssignmentForm(prev => ({ ...prev, class_id: classes[0].id }));
      }

      if (!classes || classes.length === 0) {
        setClassesWithAssignments([]);
        return;
      }

      // Get student count for each class
      const classIds = classes.map(c => c.id);
      const { data: memberCounts } = await supabase
        .from('class_members')
        .select('class_id')
        .in('class_id', classIds);

      // Get all assignments for these classes with submission counts
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
          created_by
        `)
        .in('class_id', classIds)
        .order('due_date', { ascending: false });

      if (assignError) throw assignError;

      // Get submission counts
      const assignmentIds = assignments?.map(a => a.id) || [];
      const { data: submissions } = await supabase
        .from('submissions')
        .select('assignment_id')
        .in('assignment_id', assignmentIds);

      // Group assignments by class
      const grouped: ClassWithAssignments[] = classes.map(classItem => {
        const studentCount = memberCounts?.filter(m => m.class_id === classItem.id).length || 0;
        const classAssignments = (assignments || [])
          .filter(a => a.class_id === classItem.id)
          .map(assignment => {
            const submissionCount = submissions?.filter(s => s.assignment_id === assignment.id).length || 0;
            return {
              ...assignment,
              class: classItem,
              submissionCount,
              totalStudents: studentCount
            };
          });

        return {
          ...classItem,
          assignments: classAssignments,
          studentCount
        };
      });

      setClassesWithAssignments(grouped.filter(c => c.assignments.length > 0));
    } catch (error: any) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAssignments = (assignments: AssignmentWithClass[]) => {
    const now = new Date();
    
    switch (filter) {
      case 'active':
        return assignments.filter(a => new Date(a.due_date) >= now);
      case 'past':
        return assignments.filter(a => new Date(a.due_date) < now);
      default:
        return assignments;
    }
  };

  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return;
    
    setDeleting(true);
    
    try {
      // Delete assignment submissions first
      await supabase
        .from('submissions')
        .delete()
        .eq('assignment_id', assignmentToDelete);
      
      // Delete the assignment
      const { error: deleteError } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentToDelete);
      
      if (deleteError) throw deleteError;
      
      setShowDeleteModal(false);
      setAssignmentToDelete(null);
      await loadAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Failed to delete assignment');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isPastDue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Assignments</h1>
          <p className="text-gray-600 mt-2">View and manage all your class assignments</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { key: 'all', label: 'All Assignments' },
              { key: 'active', label: 'Active' },
              { key: 'past', label: 'Past Due' }
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
              <p className="mt-1 text-sm text-gray-500">Create your first assignment to get started.</p>
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
                          {classItem.studentCount} student{classItem.studentCount !== 1 ? 's' : ''} • {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Link
                        to={`/teacher/class/${classItem.id}`}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        View Class →
                      </Link>
                    </div>
                  </div>

                  {/* Assignments Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAssignments.map(assignment => {
                      const submissionRate = assignment.totalStudents 
                        ? Math.round((assignment.submissionCount || 0) / assignment.totalStudents * 100)
                        : 0;

                      return (
                        <div key={assignment.id} className="relative group">
                          {/* Delete Button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setAssignmentToDelete(assignment.id);
                              setShowDeleteModal(true);
                            }}
                            className="absolute top-2 right-2 z-10 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            title="Delete assignment"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          
                          <Link
                            to={`/teacher/class/${assignment.class_id}/assignment/${assignment.id}`}
                            state={{ from: 'assignments' }}
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

                              {/* Due Date */}
                              <div className="space-y-2">
                                <div className={`text-sm font-medium ${
                                  isPastDue(assignment.due_date)
                                    ? 'text-red-600'
                                    : 'text-gray-700'
                                }`}>
                                  Due: {formatDate(assignment.due_date)}
                                  {isPastDue(assignment.due_date) && (
                                    <span className="ml-1">(Past Due)</span>
                                  )}
                                </div>

                                {/* Submission Stats */}
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">
                                    {assignment.submissionCount || 0}/{assignment.totalStudents || 0} submitted
                                  </span>
                                  <div className="flex items-center">
                                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                      <div
                                        className={`h-2 rounded-full ${
                                          submissionRate >= 80 ? 'bg-green-500' :
                                          submissionRate >= 50 ? 'bg-yellow-500' :
                                          'bg-red-500'
                                        }`}
                                        style={{ width: `${submissionRate}%` }}
                                      />
                                    </div>
                                    <span className="text-xs font-medium text-gray-700">
                                      {submissionRate}%
                                    </span>
                                  </div>
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
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          );
        })()}
      </div>

      {/* Create Assignment Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setAssignmentForm({
            title: '',
            description: '',
            due_date: new Date().toISOString().split('T')[0],
            due_time: '12:00',
            max_score: 100,
            class_id: allClasses[0]?.id || ''
          });
          setAttachments([]);
        }}
        title="Create Assignment"
      >
        <form onSubmit={async (e) => {
          e.preventDefault();
          
          if (!assignmentForm.title.trim()) {
            alert('Please enter an assignment title');
            return;
          }

          if (!assignmentForm.class_id) {
            alert('Please select a class');
            return;
          }

          try {
            setSubmitting(true);

            const dueDateTime = `${assignmentForm.due_date}T${assignmentForm.due_time}:00`;

            const { error } = await supabase
              .from('assignments')
              .insert([{
                class_id: assignmentForm.class_id,
                title: assignmentForm.title,
                description: assignmentForm.description || '',
                due_date: dueDateTime,
                max_score: assignmentForm.max_score,
                created_by: user?.id
              }]);

            if (error) throw error;

            setShowCreateModal(false);
            setAssignmentForm({
              title: '',
              description: '',
              due_date: new Date().toISOString().split('T')[0],
              due_time: '12:00',
              max_score: 100,
              class_id: allClasses[0]?.id || ''
            });
            setAttachments([]);
            loadAssignments();
            
            alert('Assignment created successfully!');
          } catch (error: any) {
            console.error('Error creating assignment:', error);
            alert('Failed to create assignment. Please try again.');
          } finally {
            setSubmitting(false);
          }
        }} className="space-y-4">
          <Input
            label="Title"
            value={assignmentForm.title}
            onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructions
            </label>
            <Textarea
              value={assignmentForm.description}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
              rows={4}
              placeholder="Enter assignment instructions..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Points"
              type="number"
              value={assignmentForm.max_score}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, max_score: parseInt(e.target.value) || 0 })}
              min="0"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                For
              </label>
              <select
                value={assignmentForm.class_id}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, class_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                {allClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Due date"
              type="date"
              value={assignmentForm.due_date}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })}
              required
            />
            <Input
              label="Time"
              type="time"
              value={assignmentForm.due_time}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, due_time: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attach
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => {
                const files = e.target.files;
                if (files) {
                  setAttachments(prev => [...prev, ...Array.from(files)]);
                }
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 transition-colors"
            >
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add attachment
              </div>
            </button>
            {attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                      className="text-red-600 hover:text-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Assignment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setAssignmentToDelete(null);
        }}
        title="Delete Assignment"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this assignment? This action cannot be undone and will also delete all student submissions.
          </p>
          
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setAssignmentToDelete(null);
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAssignment}
              isLoading={deleting}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete Assignment'}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};
