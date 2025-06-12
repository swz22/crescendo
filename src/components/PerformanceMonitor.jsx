import { useState, useEffect, useRef } from "react";
import { usePreviewUrl } from "../hooks/usePreviewUrl";
import { useAudioPreload } from "../hooks/useAudioPreload";

const PerformanceMonitor = ({ onClose }) => {
  const { getCacheStats, clearCache } = usePreviewUrl();
  const { getCacheStats: getAudioStats, clearCache: clearAudioCache } =
    useAudioPreload();
  const [stats, setStats] = useState(null);
  const [audioStats, setAudioStats] = useState(null);
  const [hasScrollableContent, setHasScrollableContent] = useState(false);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const cacheStats = getCacheStats();
      setStats({
        ...cacheStats,
        memoryCache: cacheStats.cached,
        localStorage: cacheStats.cached,
        prefetchQueue: cacheStats.pending,
        attemptedTracks: cacheStats.failed,
      });
      setAudioStats(getAudioStats());
    }, 1000);

    // Initial load
    setStats(getCacheStats());
    setAudioStats(getAudioStats());

    // Check if content is scrollable
    const checkScrollable = () => {
      if (scrollContainerRef.current) {
        const { scrollHeight, clientHeight } = scrollContainerRef.current;
        setHasScrollableContent(scrollHeight > clientHeight);
      }
    };

    // Check initially and on window resize
    checkScrollable();
    window.addEventListener("resize", checkScrollable);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", checkScrollable);
    };
  }, [getCacheStats, getAudioStats]);

  // Add ESC key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

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
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] animate-fadeIn"
        onClick={onClose}
      />

      <div className="fixed inset-0 flex items-center justify-center p-6 z-[61]">
        <div className="w-full max-w-[480px] h-[80vh] max-h-[700px] bg-[#1e1b4b] shadow-2xl shadow-black/50 border border-white/10 rounded-2xl overflow-hidden flex flex-col relative animate-scaleIn">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b] to-[#0f172a] opacity-100 pointer-events-none" />
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute top-0 -left-4 w-32 h-32 bg-[#14b8a6] rounded-full filter blur-3xl" />
            <div className="absolute bottom-0 -right-4 w-40 h-40 bg-[#2dd4bf] rounded-full filter blur-3xl" />
          </div>

          <div
            ref={scrollContainerRef}
            className="relative flex-1 p-5 overflow-y-auto custom-scrollbar min-h-0"
          >
            {hasScrollableContent && (
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#1e1b4b] to-transparent pointer-events-none z-10" />
            )}

            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-white to-[#2dd4bf] bg-clip-text text-transparent flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-[#14b8a6]/20 to-[#2dd4bf]/20 rounded-xl border border-[#14b8a6]/30">
                  <svg
                    className="w-5 h-5 text-[#2dd4bf]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                Performance Monitor
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all hover:scale-110"
                title="Close"
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Stats Cards */}
            <div className="mt-4 space-y-3">
              <div className="bg-white/[0.03] rounded-xl p-4 border border-white/10 hover:border-[#14b8a6]/40 transition-all duration-300 hover:bg-white/[0.05] group">
                <h4 className="text-white font-semibold text-lg mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#14b8a6] to-[#0891b2] rounded-xl flex items-center justify-center shadow-lg shadow-[#14b8a6]/20">
                    <span className="text-xs font-bold text-white">♫</span>
                  </div>
                  Song Cache
                </h4>
                {stats ? (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        label: "Cached",
                        value: stats.cached,
                        sub: "Track URLs",
                      },
                      {
                        label: "Pending",
                        value: stats.pending,
                        sub: "In progress",
                      },
                      {
                        label: "Failed",
                        value: stats.failed,
                        sub: "Retry later",
                      },
                      {
                        label: "Circuit",
                        value: stats.circuitBreakerOpen ? "OPEN" : "OK",
                        sub: stats.circuitBreakerOpen ? "Paused" : "Active",
                      },
                    ].map(({ label, value, sub }) => (
                      <div
                        key={label}
                        className="bg-black/30 rounded-lg p-3 border border-white/5"
                      >
                        <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">
                          {label}
                        </p>
                        <p className="text-white font-bold text-xl">{value}</p>
                        <p className="text-white/60 text-[13px] mt-1">{sub}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-10 h-10 border-3 border-[#14b8a6] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              <div className="bg-white/[0.03] rounded-xl p-4 hover:bg-white/[0.05] transition-all duration-300 group overflow-hidden">
                <h4 className="text-white font-semibold text-lg mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#2dd4bf] to-[#14b8a6] rounded-xl flex items-center justify-center shadow-lg shadow-[#2dd4bf]/20">
                    <span className="text-lg font-bold text-white">♪</span>
                  </div>
                  Audio Buffer Cache
                </h4>
                {audioStats ? (
                  <div>
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-300 text-sm font-medium">
                          Buffer Usage
                        </span>
                        <span className="text-white font-semibold">
                          {audioStats.cached}/{audioStats.maxCache}
                        </span>
                      </div>
                      <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#14b8a6] to-[#2dd4bf] rounded-full transition-all duration-700 relative"
                          style={{
                            width: `${
                              (audioStats.cached / audioStats.maxCache) * 100
                            }%`,
                          }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-1 bg-black/20 rounded-lg p-4">
                        <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">
                          Loading
                        </p>
                        <p className="text-white font-bold text-xl">
                          {audioStats.loading}
                        </p>
                        <p className="text-white/60 text-sm mt-1">tracks</p>
                      </div>
                      <div className="flex-1 bg-black/20 rounded-lg p-4">
                        <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">
                          Est. Memory
                        </p>
                        <p className="text-white font-bold text-xl">
                          ~{(audioStats.cached * 3).toFixed(0)}
                        </p>
                        <p className="text-white/60 text-sm mt-1">MB used</p>
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

            <div className="mt-4 rounded-xl overflow-hidden border border-[#14b8a6]/50 shadow-[0_0_8px_rgba(45,212,191,0.2)] bg-white/5 transition-all duration-300 ease-out hover:shadow-[0_0_24px_rgba(45,212,191,0.4),inset_0_0_10px_rgba(45,212,191,0.2)] hover:border-[#2dd4bf]/50 hover:bg-white/10 hover:scale-[1.01]">
              {/* Header */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0f766e] to-[#0d9488] border-b border-[#0d9488]">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#14b8a6] to-[#2dd4bf] flex items-center justify-center shadow-md shadow-[#14b8a6]/30">
                  <span className="text-white text-xs">💡</span>
                </div>
                <h4 className="text-white text-sm font-bold drop-shadow-sm">
                  Performance Tips
                </h4>
              </div>

              {/* List */}
              <div className="px-4 pt-2 pb-4">
                <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside">
                  <li>Hover over songs to preload for instant playback</li>
                  <li>Look for the lightning bolt ⚡ on cached tracks</li>
                  <li>Clear cache if experiencing playback issues</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="relative p-5 pt-3 border-t border-white/10 bg-gradient-to-b from-[#1e1b4b] to-[#0f172a] mt-auto">
            <button
              onClick={handleClearCache}
              className="w-full bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white py-3 px-6 rounded-xl transition-all duration-300 font-semibold shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 transform hover:scale-[1.02] active:scale-[0.98] [text-shadow:_0_1px_2px_rgba(0,0,0,0.3)]"
            >
              Clear Cache
            </button>

            <p className="text-xs text-gray-500 mt-3 text-center">
              Intelligent caching for seamless music playback
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default PerformanceMonitor;
