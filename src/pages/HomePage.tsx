import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { HoverButton } from '../components/HoverButton';
import ModelViewer from '../components/ModelViewer';

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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      <div className="w-full min-h-screen flex flex-col lg:flex-row">
        {/* Left side - 3D Model */}
        <div className="w-full lg:w-3/5 h-[50vh] lg:h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="w-full h-full">
            <ModelViewer
              url="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/ToyCar/glTF-Binary/ToyCar.glb"
              width="100%"
              height="100%"
              showScreenshotButton={false}
              autoRotate={true}
              autoRotateSpeed={0.5}
              fadeIn={false}
              autoFrame={true}
              defaultZoom={1.5}
              minZoomDistance={1.5}
              maxZoomDistance={1.5}
              enableManualRotation={true}
              enableManualZoom={false}
              enableHoverRotation={false}
              enableMouseParallax={false}
              defaultRotationX={0}
              defaultRotationY={0}
            />
          </div>
        </div>

        {/* Right side - Content */}
        <div className="w-full lg:w-2/5 min-h-[50vh] lg:h-screen flex items-center justify-center px-4 py-12 lg:px-8">
          <div className="max-w-xl text-center animate-fade-in">
            {/* Logo/Icon */}
            <div className="inline-flex items-center justify-center mb-8 transform hover:scale-105 transition-transform duration-200">
              <img 
                src="/fav.png" 
                alt="ClassLab Logo" 
                className="h-40 lg:h-48 w-auto"
              />
            </div>

            {/* Hero Title */}
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-6 bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 bg-clip-text text-transparent">
              Welcome to
              <br />
              BOBBIE CLASSROOM
            </h1>

            {/* Subtitle */}
            <p className="text-sm md:text-base lg:text-lg text-gray-600 mb-12">
              The modern classroom management platform for teachers, students, and administrators
            </p>

            {/* CTA Button */}
            <HoverButton
              onClick={() => navigate('/register')}
              className="px-8 lg:px-12 py-3 lg:py-4 text-base lg:text-lg font-semibold text-white"
            >
              Get Started
            </HoverButton>
          </div>
        </div>
      </div>
    </div>
  );
};
