import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const LoadingButton = ({ 
  loading, 
  children, 
  className = '', 
  disabled = false,
  type = 'button',
  onClick,
  ...props 
}) => {
  const baseClasses = 'flex justify-center items-center transition-colors';
  const combinedClasses = `${baseClasses} ${className}`;
  
  return (
    <button
      type={type}
      className={combinedClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner size="small" />
          <span className="ml-2">Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default LoadingButton;