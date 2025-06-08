import React from 'react';

const CacheIndicator = ({ isCached, size = 'sm' }) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  if (!isCached) return null;

  return (
    <div className="relative">
      <div 
        className={`${sizeClasses[size]} bg-green-500 rounded-full animate-pulse-glow`}
        title="Track cached - instant playback"
      >
        {/* Inner glow */}
        <div className="absolute inset-0 bg-green-400 rounded-full animate-pulse opacity-50" />
      </div>
    </div>
  );
};

export default CacheIndicator;