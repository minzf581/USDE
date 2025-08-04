import React from 'react';

export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`flex items-center justify-center min-h-screen ${className}`}>
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-secondary-lighter border-t-primary`}></div>
    </div>
  );
}; 