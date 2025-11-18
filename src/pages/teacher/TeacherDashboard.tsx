import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Class } from '../../types';
import { Card, Spinner, Button, Modal, Input, Textarea } from '../../components';
import { Layout } from '../../components/Layout';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    section: '',
    description: '',
  });

  useEffect(() => {
    loadClasses();
  }, [user]);

  const loadClasses = async () => {
    if (!user) {
      console.log('No user found, skipping load');
      return;
    }

    try {
      console.log('Loading classes for user:', user.id);
      
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Classes query result:', { data, error });

      if (error) {
        console.error('Error loading classes:', error);
        return;
      }

      if (data) {
        console.log('Setting classes:', data);
        setClasses(data);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateClassCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Creating class for user:', user.id);
      
      const classCode = generateClassCode();
      
      const { data, error: insertError } = await supabase
        .from('classes')
        .insert([
          {
            name: formData.name,
            section: formData.section || null,
            description: formData.description,
            code: classCode,
            teacher_id: user.id,
          },
        ])
        .select();

      console.log('Insert result:', { data, insertError });

      if (insertError) throw insertError;

      setSuccess(`Class "${formData.name}" created successfully with code: ${classCode}`);
      setShowCreateModal(false);
      setFormData({ name: '', section: '', description: '' });
      await loadClasses();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error creating class:', err);
      setError(err instanceof Error ? err.message : 'Failed to create class. Please try again.');
    } finally {
      setCreating(false);
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
        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-start animate-slide-in">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start animate-slide-in">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
            <p className="mt-2 text-gray-600">Manage your classes and assignments</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            Create Class
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Classes Grid */}
        {classes.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No classes</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new class.</p>
              <div className="mt-6">
                <Button onClick={() => setShowCreateModal(true)}>
                  Create Class
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <Link
                key={classItem.id}
                to={`/teacher/class/${classItem.id}`}
                className="block"
              >
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <div className="flex flex-col h-full">
                    <h3 className="text-xl font-semibold text-gray-900">{classItem.name}</h3>
                    {classItem.section && (
                      <p className="text-sm text-gray-600 mt-1">Section: {classItem.section}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-3 flex-grow line-clamp-3">
                      {classItem.description}
                    </p>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">Class Code:</p>
                      <p className="text-lg font-mono font-semibold text-primary-600">{classItem.code}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Class Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setError('');
        }}
        title="Create New Class"
      >
        <form onSubmit={handleCreateClass} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <Input
            label="Class Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Mathematics 101"
          />

          <Input
            label="Section (optional)"
            value={formData.section}
            onChange={(e) => setFormData({ ...formData, section: e.target.value })}
            placeholder="e.g., A, Morning"
          />

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            placeholder="Brief description of the class"
          />

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setError('');
              }}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={creating} disabled={creating}>
              {creating ? 'Creating...' : 'Create Class'}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};
