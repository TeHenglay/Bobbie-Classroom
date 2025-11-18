import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (profile?.role === 'admin') return '/admin/dashboard';
    if (profile?.role === 'teacher') return '/teacher/dashboard';
    return '/student/dashboard';
  };

  const getNavigationItems = () => {
    if (profile?.role === 'admin') {
      return [
        { label: 'Users', path: '/admin/users' },
        { label: 'Classes', path: '/admin/classes' },
      ];
    }
    if (profile?.role === 'teacher') {
      return [
        { label: 'Classes', path: '/teacher/classes' },
        { label: 'Lectures', path: '/teacher/lectures' },
      ];
    }
    return [
      { label: 'My Classes', path: '/student/classes' },
      { label: 'Join Class', path: '/student/join-class' },
      { label: 'Lectures', path: '/student/lectures' },
    ];
  };

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to={getDashboardLink()} className="flex items-center group">
                <img 
                  src="/Logo.png" 
                  alt="ClassLab Logo" 
                  className="h-10 w-auto transition-all duration-200 transform group-hover:scale-105"
                />
              </Link>
              <div className="ml-10 flex space-x-1">
                {getNavigationItems().map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="text-gray-700 hover:text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link 
                to="/profile"
                className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded-lg transition-colors"
              >
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.full_name || 'Profile'} 
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                    profile?.role === 'admin' ? 'bg-purple-600' :
                    profile?.role === 'teacher' ? 'bg-blue-600' :
                    'bg-green-600'
                  }`}>
                    {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div className="text-right hidden sm:block">
                  <p className="font-medium text-gray-800">{profile?.full_name}</p>
                  <p className="text-xs text-gray-500 capitalize inline-flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-1.5 ${
                      profile?.role === 'admin' ? 'bg-purple-500' :
                      profile?.role === 'teacher' ? 'bg-blue-500' :
                      'bg-green-500'
                    }`}></span>
                    {profile?.role}
                  </p>
                </div>
              </Link>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="shadow-sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
};
