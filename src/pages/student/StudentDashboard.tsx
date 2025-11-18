import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Class, Assignment, ClassMember } from '../../types';
import { Card, Spinner, Button } from '../../components';
import { Layout } from '../../components/Layout';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Load enrolled classes
      const { data: memberData } = await supabase
        .from('class_members')
        .select('*, class:classes(*)')
        .eq('student_id', user.id);

      if (memberData) {
        const enrolledClasses = memberData.map((m: ClassMember) => m.class).filter(Boolean) as Class[];
        setClasses(enrolledClasses);

        // Load upcoming assignments
        const classIds = enrolledClasses.map((c) => c.id);
        if (classIds.length > 0) {
          const { data: assignmentData } = await supabase
            .from('assignments')
            .select('*, class:classes(*)')
            .in('class_id', classIds)
            .gte('due_date', new Date().toISOString())
            .order('due_date', { ascending: true })
            .limit(5);

          if (assignmentData) {
            setUpcomingAssignments(assignmentData);
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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
        <div className="animate-slide-in">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Welcome Back! 👋
          </h1>
          <p className="mt-2 text-gray-600">Here's your overview for today.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="card-hover cursor-pointer group">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Enrolled Classes</p>
                <p className="text-3xl font-bold text-gray-900">{classes.length}</p>
              </div>
            </div>
          </Card>

          <Card className="card-hover cursor-pointer group">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming Assignments</p>
                <p className="text-3xl font-bold text-gray-900">{upcomingAssignments.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Upcoming Assignments */}
        <Card title="📝 Upcoming Assignments" className="animate-slide-in">
          {upcomingAssignments.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No upcoming assignments</p>
              <p className="text-gray-400 text-sm mt-1">You're all caught up! 🎉</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAssignments.map((assignment) => (
                <Link
                  key={assignment.id}
                  to={`/student/class/${assignment.class_id}/assignment/${assignment.id}`}
                  className="block p-5 border-2 border-gray-100 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {assignment.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        {assignment.class?.name}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-semibold text-gray-900 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-primary-600 font-medium mt-1">{assignment.max_score} points</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* My Classes */}
        <Card title="📚 My Classes" className="animate-slide-in">
          {classes.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl mb-4">
                <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium mb-2">You're not enrolled in any classes yet</p>
              <p className="text-gray-500 text-sm mb-4">Join a class using a code from your teacher</p>
              <Link to="/student/join-class">
                <Button className="mt-2">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Join Your First Class
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((classItem) => (
                <Link
                  key={classItem.id}
                  to={`/student/classes/${classItem.id}`}
                  className="block group"
                >
                  <div className="p-5 border-2 border-gray-100 rounded-xl hover:border-primary-300 hover:shadow-lg transition-all duration-200 h-full bg-gradient-to-br from-white to-gray-50 group-hover:from-primary-50 group-hover:to-white">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary-600 transition-colors mb-1">
                      {classItem.name}
                    </h3>
                    {classItem.section && (
                      <p className="text-sm text-gray-600 mb-2">Section: {classItem.section}</p>
                    )}
                    <p className="text-sm text-gray-500 line-clamp-2 mt-2">
                      {classItem.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};
