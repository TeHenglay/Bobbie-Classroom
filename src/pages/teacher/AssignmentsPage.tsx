import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../../components/Layout';
import { Card, Spinner } from '../../components';
import type { Class } from '../../types';

interface AssignmentForm {
  title: string;
  description: string;
  due_date: string;
  due_time: string;
  max_score: number;
  class_id: string;
}

export const AssignmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [assignmentForm, setAssignmentForm] = useState<AssignmentForm>({
    title: '',
    description: '',
    due_date: new Date().toISOString().split('T')[0],
    due_time: '12:00',
    max_score: 100,
    class_id: ''
  });

  useEffect(() => {
    if (user?.id) {
      loadClasses();
    }
  }, [user?.id]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user?.id)
        .order('name');

      if (error) throw error;
      setClasses(data || []);
      if (data && data.length > 0) {
        setAssignmentForm(prev => ({ ...prev, class_id: data[0].id }));
      }
    } catch (error: any) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setAttachments(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

      // Combine date and time
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

      // Reset form
      setAssignmentForm({
        title: '',
        description: '',
        due_date: new Date().toISOString().split('T')[0],
        due_time: '12:00',
        max_score: 100,
        class_id: classes[0]?.id || ''
      });
      setAttachments([]);

      alert('Assignment created successfully!');
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      alert('Failed to create assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Assignment</h1>
        </div>

        {classes.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-600">You don't have any classes yet. Create a class first to post assignments.</p>
            </div>
          </Card>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Main Content Card */}
            <Card>
              <div className="space-y-6">
                {/* Title Input */}
                <div>
                  <input
                    type="text"
                    placeholder="Title"
                    value={assignmentForm.title}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                    className="w-full px-0 py-2 text-xl border-0 border-b border-gray-300 focus:ring-0 focus:border-gray-400 placeholder-gray-400"
                    required
                  />
                </div>

                {/* Instructions Label and Textarea */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Instructions (optional)
                  </label>
                  <textarea
                    placeholder="Add any instructions, resources, or context for this assignment..."
                    value={assignmentForm.description}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none placeholder-gray-400"
                  />
                </div>

                {/* Divider */}
                <hr className="border-gray-200" />

                {/* Points and Due Date Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Points */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Points
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={assignmentForm.max_score}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, max_score: parseInt(e.target.value) || 0 })}
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                      />
                      <span className="absolute right-4 top-3 text-gray-400">pts</span>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due
                    </label>
                    <input
                      type="datetime-local"
                      value={`${assignmentForm.due_date}T${assignmentForm.due_time}`}
                      onChange={(e) => {
                        const [date, time] = e.target.value.split('T');
                        setAssignmentForm({ 
                          ...assignmentForm, 
                          due_date: date,
                          due_time: time
                        });
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Divider */}
                <hr className="border-gray-200" />

                {/* Class Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class
                  </label>
                  <select
                    value={assignmentForm.class_id}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, class_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    {classes.map(classItem => (
                      <option key={classItem.id} value={classItem.id}>
                        {classItem.name} {classItem.section && `(${classItem.section})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Divider */}
                <hr className="border-gray-200" />

                {/* Divider */}
                <hr className="border-gray-200" />

                {/* Attachments Display */}
                {attachments.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attachments
                    </label>
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm text-gray-700">{file.name}</span>
                            <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={handleFileSelect}
                      className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span>Add attachment</span>
                    </button>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setAssignmentForm({
                          title: '',
                          description: '',
                          due_date: new Date().toISOString().split('T')[0],
                          due_time: '12:00',
                          max_score: 100,
                          class_id: classes[0]?.id || ''
                        });
                        setAttachments([]);
                      }}
                      className="px-6 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Assigning...' : 'Assign'}
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </form>
        )}

        {/* View All Assignments Link */}
        <div className="mt-8 text-center">
          <Link
            to="/teacher/assignments"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            View all assignments →
          </Link>
        </div>
      </div>
    </Layout>
  );
};
