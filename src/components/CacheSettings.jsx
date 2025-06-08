import { useState, useEffect } from "react";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { useAudioPreload } from "../hooks/useAudioPreload";

const CacheSettings = () => {
  const { getCacheStats, clearCache } = usePreviewUrl();
  const { getCacheStats: getAudioStats, clearCache: clearAudioCache } =
    useAudioPreload();
  const [stats, setStats] = useState(null);
  const [audioStats, setAudioStats] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (showSettings) {
      const interval = setInterval(() => {
        setStats(getCacheStats());
        setAudioStats(getAudioStats());
      }, 1000);

      // Initial load
      setStats(getCacheStats());
      setAudioStats(getAudioStats());

      return () => clearInterval(interval);
    }
  }, [showSettings, getCacheStats, getAudioStats]);

  const handleClearCache = () => {
    if (
      window.confirm(
        "Clear all cached preview URLs and preloaded audio? This will require re-fetching songs."
      )
    ) {
      clearCache();
      clearAudioCache();
      setStats(getCacheStats());
      setAudioStats(getAudioStats());
    }
  };

  return (
    <>
      {/* Settings Button - positioned to the right of "See more" */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="fixed top-[52px] right-[480px] xl:right-[520px] z-40 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-all duration-200 backdrop-blur-sm"
        title="Cache Settings"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Settings Modal - positioned below the button */}
      {showSettings && (
        <div className="fixed top-[100px] right-[320px] xl:right-[360px] z-40 bg-gradient-to-br from-purple-900/95 to-black/95 backdrop-blur-xl rounded-lg shadow-2xl border border-white/10 p-6 min-w-[300px]">
          <h3 className="text-white font-bold text-lg mb-4">Cache Settings</h3>

          {/* Preview URL Cache Stats */}
          <div className="mb-4">
            <h4 className="text-white font-medium text-sm mb-2">
              Preview URL Cache
            </h4>
            {stats && (
              <div className="space-y-1 pl-2">
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
                  <span className="text-white">
                    {stats.prefetchQueue} pending
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Audio Cache Stats */}
          <div className="mb-4">
            <h4 className="text-white font-medium text-sm mb-2">
              Preloaded Audio
            </h4>
            {audioStats && (
              <div className="space-y-1 pl-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Cached Audio:</span>
                  <span className="text-white">
                    {audioStats.cached}/{audioStats.maxCache}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Loading:</span>
                  <span className="text-white">
                    {audioStats.loading} tracks
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Memory Usage:</span>
                  <span className="text-white">
                    ~{(audioStats.cached * 3).toFixed(0)} MB
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 pt-4">
            <button
              onClick={handleClearCache}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Clear All Cache
            </button>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Preloaded audio enables instant playback
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default CacheSettings;
