import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  useEffect(() => {
    // Redirect logged-in users to their dashboard
    if (user && profile) {
      switch (profile.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'teacher':
          navigate('/teacher/dashboard');
          break;
        case 'student':
          navigate('/student/dashboard');
          break;
        default:
          break;
      }
    }
  }, [user, profile, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center animate-fade-in">
        {/* Logo/Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl shadow-2xl mb-8 transform hover:scale-105 transition-transform duration-200">
          <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>

        {/* Hero Title */}
        <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 bg-clip-text text-transparent">
          Welcome to ClassLab
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto">
          The modern classroom management platform for teachers, students, and administrators
        </p>

        {/* CTA Button */}
        <Button
          onClick={() => navigate('/register')}
          variant="primary"
          size="lg"
          className="px-12 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
        >
          Get Started
        </Button>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Class Management</h3>
            <p className="text-gray-600">Create and manage classes with ease</p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Assignment Tracking</h3>
            <p className="text-gray-600">Track and grade assignments efficiently</p>
          </div>

          <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Collaboration</h3>
            <p className="text-gray-600">Connect teachers and students seamlessly</p>
          </div>
        </div>
      </div>
    </div>
  );
};
