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
        className="relative bg-gradient-to-r from-[#14b8a6]/20 to-[#2dd4bf]/20 hover:from-[#14b8a6]/30 hover:to-[#2dd4bf]/30 text-white p-2.5 rounded-full transition-all duration-300 group hover:shadow-[0_0_20px_rgba(20,184,166,0.5)]"
        title="Performance Settings"
      >
        <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Settings Overlay with improved visibility */}
      {showSettings && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 animate-fadeIn"
            onClick={handleToggle}
          />
          
          {/* Settings panel - no backdrop blur, better contrast */}
          <div className="fixed top-20 right-6 w-[420px] max-h-[calc(100vh-120px)] z-[100] animate-slideInRight">
            <div className="h-full bg-gradient-to-br from-[#1e1b4b] to-[#0f172a] shadow-2xl shadow-black/50 border border-white/10 rounded-2xl overflow-hidden">
              {/* Subtle pattern background for texture */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 -left-4 w-32 h-32 bg-[#14b8a6] rounded-full filter blur-3xl" />
                <div className="absolute bottom-0 -right-4 w-40 h-40 bg-[#2dd4bf] rounded-full filter blur-3xl" />
              </div>
              
              <div className="relative p-6 h-full overflow-y-auto custom-scrollbar">
                {/* Header with gradient text */}
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-[#2dd4bf] bg-clip-text text-transparent flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-[#14b8a6]/20 to-[#2dd4bf]/20 rounded-xl border border-[#14b8a6]/30">
                      <svg className="w-6 h-6 text-[#2dd4bf]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    Performance Monitor
                  </h3>
                  <button
                    onClick={handleToggle}
                    className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-300 hover:rotate-90"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Stats Cards with better contrast */}
                <div className="space-y-4">
                  {/* Preview URL Cache */}
                  <div className="bg-white/[0.03] rounded-xl p-5 border border-white/10 hover:border-[#14b8a6]/40 transition-all duration-300 hover:bg-white/[0.05] group">
                    <h4 className="text-white font-semibold text-lg mb-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#14b8a6] to-[#0891b2] rounded-xl flex items-center justify-center shadow-lg shadow-[#14b8a6]/20">
                        <span className="text-xs font-bold text-white">URL</span>
                      </div>
                      Preview URL Cache
                    </h4>
                    {stats ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                          <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Memory</p>
                          <p className="text-white font-bold text-2xl">{stats.memoryCache}</p>
                          <p className="text-gray-500 text-xs mt-1">Active URLs</p>
                        </div>
                        <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                          <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Storage</p>
                          <p className="text-white font-bold text-2xl">{stats.localStorage}</p>
                          <p className="text-gray-500 text-xs mt-1">Persistent</p>
                        </div>
                        <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                          <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Queue</p>
                          <p className="text-white font-bold text-2xl">{stats.prefetchQueue}</p>
                          <p className="text-gray-500 text-xs mt-1">Pending</p>
                        </div>
                        <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                          <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Total Fetched</p>
                          <p className="text-white font-bold text-2xl">{stats.attemptedTracks}</p>
                          <p className="text-gray-500 text-xs mt-1">All time</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-32">
                        <div className="w-10 h-10 border-3 border-[#14b8a6] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  {/* Audio Cache */}
                  <div className="bg-white/[0.03] rounded-xl p-5 border border-white/10 hover:border-[#2dd4bf]/40 transition-all duration-300 hover:bg-white/[0.05] group">
                    <h4 className="text-white font-semibold text-lg mb-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#2dd4bf] to-[#14b8a6] rounded-xl flex items-center justify-center shadow-lg shadow-[#2dd4bf]/20">
                        <span className="text-lg font-bold text-white">♪</span>
                      </div>
                      Audio Buffer Cache
                    </h4>
                    {audioStats ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 text-sm font-medium">Buffer Usage</span>
                            <span className="text-white font-semibold">{audioStats.cached}/{audioStats.maxCache}</span>
                          </div>
                          <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] rounded-full transition-all duration-700 relative"
                              style={{ width: `${(audioStats.cached / audioStats.maxCache) * 100}%` }}
                            >
                              <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                            <p className="text-gray-400 text-xs mb-1">Loading</p>
                            <p className="text-white font-semibold text-lg">{audioStats.loading}</p>
                            <p className="text-gray-500 text-xs">tracks</p>
                          </div>
                          <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                            <p className="text-gray-400 text-xs mb-1">Est. Memory</p>
                            <p className="text-white font-semibold text-lg">~{(audioStats.cached * 3).toFixed(0)}</p>
                            <p className="text-gray-500 text-xs">MB used</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-32">
                        <div className="w-10 h-10 border-3 border-[#2dd4bf] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Performance Tips with better styling */}
                <div className="mt-6 bg-gradient-to-br from-[#14b8a6]/10 to-[#2dd4bf]/10 rounded-xl p-5 border border-[#14b8a6]/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] flex items-center justify-center animate-pulse shadow-lg shadow-[#14b8a6]/30">
                      <span className="text-white text-sm">💡</span>
                    </div>
                    <h4 className="text-white font-semibold text-base">Performance Tips</h4>
                  </div>
                  <ul className="text-sm text-gray-300 space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="text-[#14b8a6] mt-0.5 text-lg">•</span>
                      <span>Hover over songs to preload for instant playback</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#2dd4bf] mt-0.5 text-lg">•</span>
                      <span>Look for the lightning bolt ⚡ on cached tracks</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#5eead4] mt-0.5 text-lg">•</span>
                      <span>Clear cache if experiencing playback issues</span>
                    </li>
                  </ul>
                </div>
                
                {/* Clear Cache Button */}
                <button
                  onClick={handleClearCache}
                  className="mt-6 w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3.5 px-6 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-red-500/25 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Clear All Cache
                </button>
                
                <p className="text-xs text-gray-500 mt-4 text-center">
                  Intelligent caching for seamless music playback
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