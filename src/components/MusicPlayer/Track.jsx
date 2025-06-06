import React from 'react';

const Track = ({ isPlaying, isActive, activeSong, songImage }) => (
  <div className="flex-1 flex items-center justify-start">
    <div className={`${isPlaying && isActive ? 'animate-[spin_3s_linear_infinite]' : ''} hidden sm:block h-16 w-16 mr-4`}>
      <img 
        src={songImage} 
        alt="cover art" 
        className="rounded-full" 
        onError={(e) => {
          e.target.src = 'https://via.placeholder.com/64x64.png?text=No+Image';
        }}
      />
    </div>
    <div className="w-[50%]">
      <p className="truncate text-white font-bold text-lg">
        {activeSong?.title || activeSong?.attributes?.name || 'No active Song'}
      </p>
      <p className="truncate text-gray-300">
        {activeSong?.subtitle || activeSong?.attributes?.artistName || activeSong?.artist || 'Unknown Artist'}
      </p>
    </div>
  </div>
);

export default Track;