import { useState, useEffect } from 'react';
import { usePreviewUrl } from '../hooks/usePreviewUrl';
import { useAudioPreload } from '../hooks/useAudioPreload';

const CacheSettings = () => {
  const { getCacheStats, clearCache } = usePreviewUrl();
  const { getCacheStats: getAudioStats, clearCache: clearAudioCache } = useAudioPreload();
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

  const handleToggle = () => {
    setShowSettings(!showSettings);
  };

  const handleClearCache = () => {
    if (window.confirm('Clear all cached preview URLs and preloaded audio? This will require re-fetching songs.')) {
      clearCache();
      clearAudioCache();
      setStats(getCacheStats());
      setAudioStats(getAudioStats());
    }
  };

  return (
    <>
      {/* Settings Button with glow effect */}
      <button
        onClick={handleToggle}
        className="relative bg-gradient-to-r from-[#7c3aed]/20 to-[#9333ea]/20 hover:from-[#7c3aed]/30 hover:to-[#9333ea]/30 text-white p-2.5 rounded-full transition-all duration-300 backdrop-blur-sm group hover:shadow-[0_0_20px_rgba(124,58,237,0.5)]"
        title="Performance Settings"
      >
        <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Settings Overlay with glassmorphism */}
      {showSettings && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-fadeIn"
            onClick={handleToggle}
          />
          
          {/* Settings panel with cool animations */}
          <div className="fixed top-[68px] right-6 bottom-6 w-[400px] z-50 animate-slideInRight">
            <div className="h-full bg-gradient-to-br from-[#2d2467]/90 to-[#1a1848]/90 backdrop-blur-2xl shadow-[0_0_40px_rgba(124,58,237,0.3)] border border-white/20 rounded-2xl overflow-hidden">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 -left-4 w-24 h-24 bg-[#7c3aed] rounded-full filter blur-xl animate-pulse" />
                <div className="absolute bottom-0 -right-4 w-32 h-32 bg-[#9333ea] rounded-full filter blur-xl animate-pulse delay-1000" />
              </div>
              
              <div className="relative p-6 h-full overflow-y-auto">
                {/* Header with gradient text */}
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-[#a855f7] bg-clip-text text-transparent flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-[#7c3aed]/30 to-[#9333ea]/30 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    Performance
                  </h3>
                  <button
                    onClick={handleToggle}
                    className="text-gray-400 hover:text-white transition-colors hover:rotate-90 duration-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Stats Cards with hover effects */}
                <div className="space-y-4">
                  {/* Preview URL Cache */}
                  <div className="bg-white/5 backdrop-blur-lg rounded-xl p-5 border border-white/10 hover:border-[#7c3aed]/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] group">
                    <h4 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#7c3aed] to-[#9333ea] rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold">URL</span>
                      </div>
                      Preview Cache
                    </h4>
                    {stats ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-black/20 rounded-lg p-3">
                          <p className="text-gray-400 text-xs mb-1">Memory</p>
                          <p className="text-white font-bold text-lg">{stats.memoryCache}</p>
                        </div>
                        <div className="bg-black/20 rounded-lg p-3">
                          <p className="text-gray-400 text-xs mb-1">Storage</p>
                          <p className="text-white font-bold text-lg">{stats.localStorage}</p>
                        </div>
                        <div className="bg-black/20 rounded-lg p-3">
                          <p className="text-gray-400 text-xs mb-1">Queue</p>
                          <p className="text-white font-bold text-lg">{stats.prefetchQueue}</p>
                        </div>
                        <div className="bg-black/20 rounded-lg p-3">
                          <p className="text-gray-400 text-xs mb-1">Attempts</p>
                          <p className="text-white font-bold text-lg">{stats.attemptedTracks}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-20">
                        <div className="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  {/* Audio Cache */}
                  <div className="bg-white/5 backdrop-blur-lg rounded-xl p-5 border border-white/10 hover:border-[#9333ea]/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(147,51,234,0.2)] group">
                    <h4 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#9333ea] to-[#a855f7] rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold">♪</span>
                      </div>
                      Audio Buffer
                    </h4>
                    {audioStats ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">Cached</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-black/30 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-[#9333ea] to-[#a855f7] rounded-full transition-all duration-500"
                                style={{ width: `${(audioStats.cached / audioStats.maxCache) * 100}%` }}
                              />
                            </div>
                            <span className="text-white font-medium text-sm">{audioStats.cached}/{audioStats.maxCache}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">Loading</span>
                          <span className="text-white font-medium">{audioStats.loading} tracks</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">Memory</span>
                          <span className="text-white font-medium">~{(audioStats.cached * 3).toFixed(0)} MB</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-20">
                        <div className="w-8 h-8 border-2 border-[#9333ea] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Performance Tips with animated icon */}
                <div className="mt-6 bg-gradient-to-br from-[#7c3aed]/10 to-[#9333ea]/10 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#7c3aed] to-[#9333ea] flex items-center justify-center animate-pulse">
                      <span className="text-white text-xs">💡</span>
                    </div>
                    <h4 className="text-white font-medium">Pro Tips</h4>
                  </div>
                  <ul className="text-xs text-gray-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-[#7c3aed] mt-0.5">▸</span>
                      <span>Hover over songs to preload for instant playback</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#9333ea] mt-0.5">▸</span>
                      <span>Cached songs have a lightning indicator</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#a855f7] mt-0.5">▸</span>
                      <span>Clear cache if experiencing playback issues</span>
                    </li>
                  </ul>
                </div>
                
                {/* Clear Cache Button with gradient animation */}
                <button
                  onClick={handleClearCache}
                  className="mt-6 w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 px-4 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] transform hover:scale-[1.02]"
                >
                  Clear All Cache
                </button>
                
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Performance optimization powered by intelligent caching
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default CacheSettings;