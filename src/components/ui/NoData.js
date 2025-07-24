import React from 'react';

const NoData = ({ text = 'No data available.' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <svg className="w-24 h-24 text-gray-300 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none" />
        <path d="M16 24h16M24 16v16" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <p className="mt-4 text-lg text-gray-500 font-semibold animate-pulse">{text}</p>
    </div>
  );
};

export default NoData; 