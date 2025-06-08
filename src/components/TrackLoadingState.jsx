import React, { useState, useEffect } from 'react';
import MusicLoadingSpinner from './MusicLoadingSpinner';

const TrackLoadingState = ({ isLoading, onTimeout }) => {
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setShowMessage(true);
      }, 1500);

      return () => {
        clearTimeout(timer);
        setShowMessage(false);
      };
    }
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-purple-900/90 to-black/90 rounded-2xl p-8 shadow-2xl border border-white/10 flex flex-col items-center space-y-4 animate-scaleIn">
        <MusicLoadingSpinner size="lg" />
        
        <div className="text-center space-y-2">
          <p className="text-white font-medium text-lg">
            Loading track preview...
          </p>
          {showMessage && (
            <p className="text-gray-400 text-sm animate-fadeIn">
              Finding the best quality stream
            </p>
          )}
        </div>
        
        {/* Progress indicator */}
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-loading-progress" />
        </div>
      </div>
    </div>
  );
};

export default TrackLoadingState;