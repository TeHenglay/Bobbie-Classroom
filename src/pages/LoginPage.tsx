import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to register page which now handles both login and register
    navigate('/register', { state: { showSignIn: true } });
  }, [navigate]);

  return null;
};

