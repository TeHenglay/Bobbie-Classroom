import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSearch } from '../contexts/SearchContext';
import { Button } from '../components';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, profile, signOut } = useAuth();
  const { searchTerm, setSearchTerm } = useSearch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getNavigationItems = () => {
    const role = profile?.role;
    const baseItems = [
      { 
        label: 'Classes', 
        path: role === 'admin' ? '/admin/classes' : role === 'teacher' ? '/teacher/classes' : '/student/classes',
        icon: (
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        )
      },
      { 
        label: 'Assignment', 
        path: role === 'teacher' ? '/teacher/assignments' : '/student/assignments',
        icon: (
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        )
      },
      { 
        label: 'Lectures', 
        path: role === 'teacher' ? '/teacher/lectures' : '/student/lectures',
        icon: (
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
        )
      },
      { 
        label: 'Board', 
        path: '/board',
        icon: (
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
        )
      },
    ];
    
    return baseItems;
  };

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200 px-4">
          <div className="flex items-center gap-2">
            <img 
              src="/Logo.png" 
              alt="ClassLab Logo" 
              className="h-8 w-auto"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-grow p-4 space-y-2">
          {getNavigationItems().map((item) => {
            const isActive = location.pathname === item.path || 
                           (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => console.log('Navigating to:', item.path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-gray-900 transition-colors ${
                  isActive 
                    ? 'bg-indigo-600 text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Account/Profile Section */}
        <div className="p-4 border-t border-gray-200">
          <Link 
            to="/profile"
            className="flex items-center gap-3 hover:bg-gray-100 p-3 rounded-lg transition-colors"
          >
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.full_name || 'Profile'} 
                className="w-10 h-10 rounded-full object-cover border-2 border-indigo-400"
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
            <div>
              <p className="font-semibold text-gray-900 text-sm">{profile?.full_name}</p>
              <p className="text-xs text-gray-600 capitalize">{profile?.role}</p>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar with Search */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search here..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors placeholder-gray-400"
              />
            </div>
          </div>
          {(profile?.role === 'teacher' || profile?.role === 'admin') && (
            <div className="ml-6">
              {location.pathname.includes('/classes') && (
                <Button
                  onClick={() => {
                    if (profile?.role === 'teacher') {
                      const event = new CustomEvent('openCreateClassModal');
                      window.dispatchEvent(event);
                    } else {
                      navigate('/admin/classes/create');
                    }
                  }}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Class
                </Button>
              )}
              {location.pathname.includes('/assignments') && (
                <Button
                  onClick={() => {
                    const event = new CustomEvent('openCreateAssignmentModal');
                    window.dispatchEvent(event);
                  }}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Assignment
                </Button>
              )}
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-grow bg-white overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
