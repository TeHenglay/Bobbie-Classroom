import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSearch } from '../../contexts/SearchContext';
import type { Class } from '../../types';
import { Card, Spinner, Button, Modal, Input, Textarea } from '../../components';
import { Layout } from '../../components/Layout';

interface ClassWithStudents extends Class {
  studentCount?: number;
  students?: Array<{
    full_name: string;
    avatar_url?: string;
  }>;
}

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const { searchTerm } = useSearch();
  const [classes, setClasses] = useState<ClassWithStudents[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    section: '',
    description: '',
  });

  useEffect(() => {
    loadClasses();
  }, [user]);

  useEffect(() => {
    const handleOpenModal = () => setShowCreateModal(true);
    window.addEventListener('openCreateClassModal', handleOpenModal);
    return () => window.removeEventListener('openCreateClassModal', handleOpenModal);
  }, []);

  const loadClasses = async () => {
    if (!user) {
      console.log('No user found, skipping load');
      return;
    }

    try {
      console.log('Loading classes for user:', user.id);
      
      // Fetch teacher profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      if (profileData) {
        setTeacherName(profileData.full_name);
      }
      
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
        
        // Fetch student count and avatars for each class
        const classesWithStudents = await Promise.all(
          data.map(async (classItem) => {
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
              .limit(3);
            
            const { count } = await supabase
              .from('class_members')
              .select('*', { count: 'exact', head: true })
              .eq('class_id', classItem.id);
            
            return {
              ...classItem,
              studentCount: count || 0,
              students: members?.map((m: any) => m.profiles).filter(Boolean) || []
            };
          })
        );
        
        setClasses(classesWithStudents);
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

      if (insertError) {
        console.error('Supabase insert error:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        throw insertError;
      }

      setSuccess(`Class "${formData.name}" created successfully with code: ${classCode}`);
      setShowCreateModal(false);
      setFormData({ name: '', section: '', description: '' });
      await loadClasses();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error creating class:', err);
      const errorMessage = err?.message || err?.details || err?.hint || 'Failed to create class. Please try again.';
      setError(errorMessage);
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
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Class
          </Button>
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
            </div>
          </Card>
        ) : (() => {
          const filteredClasses = classes.filter(classItem =>
            classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            classItem.section?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            classItem.code.toLowerCase().includes(searchTerm.toLowerCase())
          );
          
          return filteredClasses.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                <p className="mt-1 text-sm text-gray-500">Try searching with different keywords.</p>
              </div>
            </Card>
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
                  to={`/teacher/class/${classItem.id}`}
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
                        <div className={`w-8 h-8 rounded-full ${color.bg} flex items-center justify-center text-white font-semibold text-sm`}>
                          {teacherName?.charAt(0).toUpperCase() || 'T'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Teacher: <span className="font-medium text-gray-900">{teacherName || 'You'}</span></p>
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
                        
                        {/* Student Avatars */}
                        <div className="flex items-center gap-2">
                          {classItem.students && classItem.students.length > 0 ? (
                            <>
                              <div className="flex -space-x-2">
                                {classItem.students.slice(0, 3).map((student, idx) => (
                                  student.avatar_url ? (
                                    <img
                                      key={idx}
                                      src={student.avatar_url}
                                      alt={student.full_name}
                                      className="w-8 h-8 rounded-full border-2 border-white object-cover"
                                    />
                                  ) : (
                                    <div
                                      key={idx}
                                      className={`w-8 h-8 rounded-full border-2 border-white ${color.bg} flex items-center justify-center text-white text-xs font-semibold`}
                                    >
                                      {student.full_name?.charAt(0).toUpperCase() || 'S'}
                                    </div>
                                  )
                                ))}
                              </div>
                              <span className="text-xs text-gray-600">
                                {classItem.studentCount === 1 ? '1 student' : `${classItem.studentCount} students`}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-gray-500 italic">No students yet</span>
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
