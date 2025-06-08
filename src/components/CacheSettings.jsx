import { useState, useEffect } from 'react';
import { usePreviewUrl } from '../hooks/usePreviewUrl';

const CacheSettings = () => {
  console.log('CacheSettings component rendering'); // Add this debug line
  
  const { getCacheStats, clearCache } = usePreviewUrl();
  const [stats, setStats] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (showSettings) {
      const interval = setInterval(() => {
        setStats(getCacheStats());
      }, 1000);
      
      // Initial load
      setStats(getCacheStats());
      
      return () => clearInterval(interval);
    }
  }, [showSettings, getCacheStats]);

  const handleClearCache = () => {
    if (window.confirm('Clear all cached preview URLs? This will require re-fetching songs.')) {
      clearCache();
      setStats(getCacheStats());
    }
  };

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="fixed bottom-32 right-8 z-40 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all duration-200"
        title="Cache Settings"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed bottom-48 right-8 z-40 bg-gradient-to-br from-purple-900/95 to-black/95 backdrop-blur-xl rounded-lg shadow-2xl border border-white/10 p-6 min-w-[300px]">
          <h3 className="text-white font-bold text-lg mb-4">Cache Settings</h3>
          
          {stats && (
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Memory Cache:</span>
                <span className="text-white">{stats.memoryCache} songs</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Local Storage:</span>
                <span className="text-white">{stats.localStorage} songs</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Prefetch Queue:</span>
                <span className="text-white">{stats.prefetchQueue} pending</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Attempted Tracks:</span>
                <span className="text-white">{stats.attemptedTracks} tracks</span>
              </div>
            </div>
          )}
          
          <div className="border-t border-white/10 pt-4">
            <button
              onClick={handleClearCache}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Clear All Cache
            </button>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Cached URLs improve performance and reduce API calls
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default CacheSettings;