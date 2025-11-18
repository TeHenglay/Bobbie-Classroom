import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button, Spinner, Modal, Input, Textarea } from '../../components';
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

interface ClassMember {
  student_id: string;
  profiles: {
    id: string;
    full_name: string;
    email: string;
  };
}

export const ClassPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const { user, profile } = useAuth();
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [classMembers, setClassMembers] = useState<ClassMember[]>([]);
  const [activeTab, setActiveTab] = useState<'stream' | 'classwork' | 'people'>('stream');
  const [loading, setLoading] = useState(true);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    due_date: '',
    max_score: 100,
  });
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setAttachments([...attachments, ...files]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
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

      // Load announcements
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      if (announcementsData) {
        setAnnouncements(announcementsData);
      }

      // Load class members with their profiles
      const { data: membersData, error: membersError } = await supabase
        .from('class_members')
        .select('student_id')
        .eq('class_id', classId);

      console.log('Class ID:', classId);
      console.log('Class members raw data:', membersData);
      console.log('Class members error:', membersError);

      if (membersData && membersData.length > 0) {
        // Fetch profiles for each student
        const studentIds = membersData.map(m => m.student_id);
        console.log('Student IDs:', studentIds);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', studentIds);

        console.log('Profiles data:', profilesData);
        console.log('Profiles error:', profilesError);

        if (profilesData) {
          const membersWithProfiles = membersData.map(member => ({
            student_id: member.student_id,
            profiles: profilesData.find(p => p.id === member.student_id)
          }));
          console.log('Members with profiles:', membersWithProfiles);
          setClassMembers(membersWithProfiles as any);
        }
      } else {
        console.log('No members data or empty array');
        setClassMembers([]);
      }
    } catch (error) {
      console.error('Error loading class data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');

    try {
      if (!user?.id || !classId) {
        throw new Error('Missing user or class information');
      }

      // Make description optional, provide default if empty
      const description = assignmentForm.description || 'No additional instructions provided.';

      const { data, error: insertError } = await supabase
        .from('assignments')
        .insert([
          {
            class_id: classId,
            title: assignmentForm.title,
            description: description,
            due_date: assignmentForm.due_date,
            max_score: assignmentForm.max_score,
            created_by: user.id,
          },
        ])
        .select();

      if (insertError) throw insertError;

      setSuccess(`Assignment "${assignmentForm.title}" assigned successfully!`);
      setShowCreateAssignment(false);
      setAssignmentForm({ title: '', description: '', due_date: '', max_score: 100 });
      setAttachments([]);
      await loadClassData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error creating assignment:', err);
      setError(err instanceof Error ? err.message : 'Failed to create assignment');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');

    try {
      if (!user?.id || !classId) {
        throw new Error('Missing user or class information');
      }

      const { data, error: insertError } = await supabase
        .from('announcements')
        .insert([
          {
            class_id: classId,
            title: announcementForm.title,
            message: announcementForm.message,
            created_by: user.id,
          },
        ])
        .select();

      if (insertError) throw insertError;

      setSuccess('Announcement posted successfully!');
      setShowCreateAnnouncement(false);
      setAnnouncementForm({ title: '', message: '' });
      await loadClassData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error creating announcement:', err);
      setError(err instanceof Error ? err.message : 'Failed to create announcement');
    } finally {
      setCreating(false);
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
          <Link to="/teacher/dashboard" className="text-primary-600 hover:underline mt-4 inline-block">
            Back to Dashboard
          </Link>
        </div>
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

        {/* Class Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 text-white">
            <Link to="/teacher/dashboard" className="text-white/80 hover:text-white mb-4 inline-flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Classes
            </Link>
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
                      {assignments.slice(0, 3).map((assignment) => (
                        <Link
                          key={assignment.id}
                          to={`/teacher/class/${classId}/assignment/${assignment.id}`}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center">
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
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Announcements */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Announcements</h3>
                    <Button size="sm" onClick={() => setShowCreateAnnouncement(true)}>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Post
                    </Button>
                  </div>
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
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Assignments</h3>
                  <Button onClick={() => setShowCreateAssignment(true)}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Assignment
                  </Button>
                </div>
                {assignments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>No assignments yet</p>
                    <p className="text-sm mt-2">Create your first assignment to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignments.map((assignment) => (
                      <Link
                        key={assignment.id}
                        to={`/teacher/class/${classId}/assignment/${assignment.id}`}
                        className="block p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-primary-300 transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start">
                            <div className="p-2 bg-blue-100 rounded-lg mr-3">
                              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-1">{assignment.title}</h4>
                              <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span>Due: {formatDate(assignment.due_date)}</span>
                                <span>•</span>
                                <span>{assignment.max_score} points</span>
                              </div>
                            </div>
                          </div>
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* People Tab */}
            {activeTab === 'people' && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Class Members</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Teachers</h4>
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {profile?.full_name?.charAt(0).toUpperCase() || 'T'}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{profile?.full_name || 'Teacher'}</p>
                        <p className="text-sm text-gray-500">{profile?.email}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Students ({classMembers.length})
                    </h4>
                    {classMembers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No students enrolled yet</p>
                        <p className="text-sm mt-2">Share the class code for students to join</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {classMembers.map((member) => (
                          <div key={member.student_id} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {member.profiles.full_name?.charAt(0).toUpperCase() || 'S'}
                            </div>
                            <div className="ml-3">
                              <p className="font-medium text-gray-900">{member.profiles.full_name || 'Student'}</p>
                              <p className="text-sm text-gray-500">{member.profiles.email}</p>
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
                <p className="text-sm text-gray-600">Share this code with students</p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Assignments</span>
                  <span className="font-semibold text-gray-900">{assignments.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Announcements</span>
                  <span className="font-semibold text-gray-900">{announcements.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Students</span>
                  <span className="font-semibold text-gray-900">{classMembers.length}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Assignment Modal */}
      {showCreateAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Assignment</h2>
              <button
                onClick={() => {
                  setShowCreateAssignment(false);
                  setError('');
                  setAttachments([]);
                  setAssignmentForm({ title: '', description: '', due_date: '', max_score: 100 });
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateAssignment}>
              {/* Content */}
              <div className="p-6 space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Title Input */}
                <div>
                  <input
                    type="text"
                    value={assignmentForm.title}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                    required
                    placeholder="Title"
                    className="w-full text-3xl font-normal border-0 border-b-2 border-gray-200 focus:border-primary-600 focus:ring-0 px-0 py-3 placeholder-gray-400 transition-colors"
                  />
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Instructions (optional)
                  </label>
                  <textarea
                    value={assignmentForm.description}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                    rows={5}
                    placeholder="Add any instructions, resources, or context for this assignment..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none transition-all hover:border-gray-400"
                  />
                </div>

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
                        required
                        min="0"
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <span className="text-gray-400 text-sm">pts</span>
                      </div>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        value={assignmentForm.due_date}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg cursor-pointer"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attachments Display */}
                {attachments.length > 0 && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Attachments ({attachments.length})
                    </label>
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors group">
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
                            title="Remove attachment"
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
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif"
              />

              {/* Footer Actions */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                    title="Add attachment"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span className="text-sm font-medium">Add attachment</span>
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateAssignment(false);
                      setError('');
                      setAttachments([]);
                      setAssignmentForm({ title: '', description: '', due_date: '', max_score: 100 });
                    }}
                    disabled={creating}
                    className="px-6 py-2.5"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    isLoading={creating} 
                    disabled={creating || !assignmentForm.title || !assignmentForm.due_date}
                    className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 shadow-md hover:shadow-lg transition-all"
                  >
                    {creating ? 'Assigning...' : 'Assign'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Announcement Modal */}
      {showCreateAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between rounded-t-lg">
              <h2 className="text-xl font-semibold text-white">Post Announcement</h2>
              <button
                onClick={() => {
                  setShowCreateAnnouncement(false);
                  setError('');
                  setAnnouncementForm({ title: '', message: '' });
                }}
                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement}>
              {/* Content */}
              <div className="p-6 space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Title Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                    required
                    placeholder="e.g., Important Update, Reminder, Class Cancelled"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={announcementForm.message}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                    required
                    rows={6}
                    placeholder="Write your announcement here..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none transition-all hover:border-gray-400"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3 rounded-b-lg">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateAnnouncement(false);
                    setError('');
                    setAnnouncementForm({ title: '', message: '' });
                  }}
                  disabled={creating}
                  className="px-6 py-2.5"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  isLoading={creating} 
                  disabled={creating || !announcementForm.title || !announcementForm.message}
                  className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 shadow-md hover:shadow-lg transition-all"
                >
                  {creating ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};
