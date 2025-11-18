import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-fade-in ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>}
      {children}
    </div>
  );
};
