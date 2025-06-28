import React from 'react';

const LoadingSpinner = ({ size = 'medium', text = '', fullScreen = false, overlay = false }) => {
  // Size variants
  const sizeClasses = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-b-2',
    large: 'h-12 w-12 border-b-3'
  };

  // Container classes based on props
  const containerClasses = fullScreen 
    ? 'fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50' 
    : overlay 
      ? 'absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10' 
      : 'flex flex-col items-center justify-center';

  return (
    <div className={containerClasses}>
      <div className={`animate-spin rounded-full ${sizeClasses[size]} border-blue-600`}></div>
      {text && <p className="mt-2 text-gray-600">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;