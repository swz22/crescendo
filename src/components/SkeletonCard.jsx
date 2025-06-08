import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="flex flex-col w-full max-w-[250px] p-4 bg-white/5 backdrop-blur-sm rounded-lg animate-pulse">
      {/* Image skeleton */}
      <div className="w-full aspect-square rounded-lg skeleton bg-white/10" />
      
      {/* Title skeleton */}
      <div className="mt-4 space-y-2">
        <div className="h-4 bg-white/10 rounded skeleton" />
        <div className="h-3 bg-white/10 rounded skeleton w-3/4" />
      </div>
    </div>
  );
};

export default SkeletonCard;