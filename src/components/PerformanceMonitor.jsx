import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { IoClose } from "react-icons/io5";
import { HiLightningBolt } from "react-icons/hi";
import { BsSpeedometer2 } from "react-icons/bs";
import { TbWaveSine } from "react-icons/tb";
import { previewUrlManager } from "../utils/previewUrlManager";
// Audio buffer tracking will use in-memory state
import { clearAllAppData } from "../utils/storageManager";

const PerformanceMonitor = ({ onClose }) => {
  const dispatch = useDispatch();
  const [stats, setStats] = useState({
    cached: 0,
    pending: 0,
    failed: 0,
    circuitBreakerOpen: false,
  });
  const [audioStats, setAudioStats] = useState({
    bufferSizeInMB: 0,
    currentlyBuffered: 0,
    totalBuffered: 0,
    totalRequested: 1,
  });
  const [performanceScore, setPerformanceScore] = useState(0);
  const [bufferHistory, setBufferHistory] = useState([]);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const resetTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      // Clean up animation frame
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      // Clean up reset timeout
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = null;
      }
    };
  }, []);

  // Calculate performance score
  const calculateScore = (stats, audioStats) => {
    if (!stats || !audioStats) return 0;

    const cacheRatio = stats.cached / (stats.cached + stats.failed + 1);
    const bufferHealth =
      audioStats.totalBuffered / Math.max(audioStats.totalRequested, 1);
    const circuitHealth = stats.circuitBreakerOpen ? 0 : 1;

    return Math.round(cacheRatio * 50 + bufferHealth * 40 + circuitHealth * 10);
  };

  // Update stats
  useEffect(() => {
    const updateStats = () => {
      if (!isMountedRef.current) return;

      const newStats = previewUrlManager.getCacheStats();
      setStats(newStats);

      // Simulate audio stats based on cache performance
      const mockAudioStats = {
        bufferSizeInMB: Math.random() * 50 + 10,
        currentlyBuffered: Math.floor(Math.random() * 5),
        totalBuffered: newStats.cached,
        totalRequested: newStats.cached + newStats.failed + 1,
      };
      setAudioStats(mockAudioStats);

      const score = calculateScore(newStats, mockAudioStats);
      setPerformanceScore(score);

      // Update buffer history for graph
      setBufferHistory((prev) => {
        const newHistory = [...prev, mockAudioStats.bufferSizeInMB];
        return newHistory.slice(-30); // Keep last 30 data points
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || bufferHistory.length < 2) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    const draw = () => {
      if (!isMountedRef.current || !canvasRef.current) {
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, "rgba(20, 184, 166, 0)");
      gradient.addColorStop(1, "rgba(20, 184, 166, 0.3)");

      // Draw the graph
      ctx.beginPath();
      ctx.moveTo(0, height);

      bufferHistory.forEach((value, index) => {
        const x = (index / (bufferHistory.length - 1)) * width;
        const y = height - (value / 100) * height;
        ctx.lineTo(x, y);
      });

      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw the line
      ctx.beginPath();
      ctx.moveTo(0, height - (bufferHistory[0] / 100) * height);
      bufferHistory.forEach((value, index) => {
        const x = (index / (bufferHistory.length - 1)) * width;
        const y = height - (value / 100) * height;
        ctx.lineTo(x, y);
      });
      ctx.strokeStyle = "#14b8a6";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Only continue animation if mounted
      if (isMountedRef.current) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    // Cleanup function
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [bufferHistory]);

  const handleClearCache = () => {
    previewUrlManager.clearCache();
    // Reset audio stats
    setAudioStats({
      bufferSizeInMB: 0,
      currentlyBuffered: 0,
      totalBuffered: 0,
      totalRequested: 1,
    });
    setBufferHistory([]);
  };

  const handleResetApp = () => {
    if (!showResetConfirm) {
      setShowResetConfirm(true);
      // Clear any existing timeout
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
      // Set new timeout with ref
      resetTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setShowResetConfirm(false);
        }
        resetTimeoutRef.current = null;
      }, 3000);
      return;
    }

    setIsResetting(true);
    clearAllAppData();
    setTimeout(() => window.location.reload(), 1000);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const getScoreGlow = (score) => {
    if (score >= 80) return "0 0 40px rgba(16, 185, 129, 0.5)";
    if (score >= 60) return "0 0 40px rgba(245, 158, 11, 0.5)";
    return "0 0 40px rgba(239, 68, 68, 0.5)";
  };

  const getPerformanceText = (score) => {
    if (score >= 80) return "Excellent Performance";
    if (score >= 60) return "Good Performance";
    return "Needs Optimization";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl">
        {/* Multi-layer glass effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#14b8a6]/10 to-[#a855f7]/10 rounded-3xl blur-xl" />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#1e40af]/10 to-[#ec4899]/10 rounded-3xl blur-2xl animate-pulse" />

        <div className="relative bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Static gradient border */}
          <div className="absolute inset-0 rounded-3xl p-[1px] bg-gradient-to-r from-[#0f766e]/40 via-[#6b21a8]/40 to-[#1e3a8a]/40" />

          <div className="relative bg-black/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#14b8a6] to-[#0891b2] rounded-2xl flex items-center justify-center shadow-lg shadow-[#14b8a6]/30">
                  <BsSpeedometer2 className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Performance Monitor
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all duration-300 group"
              >
                <IoClose className="w-5 h-5 text-white/60 group-hover:text-white" />
              </button>
            </div>

            {/* Hero Performance Score */}
            <div className="mb-8 text-center">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-48 h-48 -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke={getScoreColor(performanceScore)}
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(performanceScore / 100) * 553} 553`}
                    className="transition-all duration-700 ease-out"
                    style={{
                      filter: `drop-shadow(${getScoreGlow(performanceScore)})`,
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className="text-5xl font-bold transition-colors duration-700"
                    style={{ color: getScoreColor(performanceScore) }}
                  >
                    {performanceScore}
                  </span>
                  <span className="text-white/60 text-sm font-medium mt-1">
                    {getPerformanceText(performanceScore)}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/[0.05] rounded-2xl p-4 border border-white/10">
                <p className="text-white/60 text-sm mb-1">Cached</p>
                <p className="text-2xl font-bold text-[#14b8a6]">
                  {stats.cached}
                </p>
              </div>
              <div className="bg-white/[0.05] rounded-2xl p-4 border border-white/10">
                <p className="text-white/60 text-sm mb-1">Pending</p>
                <p className="text-2xl font-bold text-[#f59e0b]">
                  {stats.pending}
                </p>
              </div>
              <div className="bg-white/[0.05] rounded-2xl p-4 border border-white/10">
                <p className="text-white/60 text-sm mb-1">Failed</p>
                <p className="text-2xl font-bold text-[#ef4444]">
                  {stats.failed}
                </p>
              </div>
              <div className="bg-white/[0.05] rounded-2xl p-4 border border-white/10">
                <p className="text-white/60 text-sm mb-1">Hit Rate</p>
                <p className="text-2xl font-bold text-white">
                  {stats.cached + stats.failed > 0
                    ? Math.round(
                        (stats.cached / (stats.cached + stats.failed)) * 100
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>

            {/* Performance Graph */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <TbWaveSine className="w-5 h-5 text-[#14b8a6]" />
                  Buffer Activity
                </h3>
                <span className="text-sm text-white/60">
                  {audioStats.bufferSizeInMB.toFixed(1)} MB
                </span>
              </div>
              <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/10">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={100}
                  className="w-full h-[100px]"
                />
              </div>
            </div>

            {/* Audio Stats */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <HiLightningBolt className="w-5 h-5 text-[#14b8a6]" />
                Audio Performance
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white/[0.05] rounded-xl px-4 py-3">
                  <span className="text-white/80">Buffer Size</span>
                  <span className="text-white font-medium">
                    {audioStats.bufferSizeInMB.toFixed(1)} MB
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white/[0.05] rounded-xl px-4 py-3">
                  <span className="text-white/80">Currently Buffered</span>
                  <span className="text-white font-medium">
                    {audioStats.currentlyBuffered} tracks
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white/[0.05] rounded-xl px-4 py-3">
                  <span className="text-white/80">Success Rate</span>
                  <span className="text-white font-medium">
                    {audioStats.totalRequested > 0
                      ? Math.round(
                          (audioStats.totalBuffered /
                            audioStats.totalRequested) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white/[0.05] rounded-xl px-4 py-3">
                  <span className="text-white/80">Circuit Breaker</span>
                  <span
                    className={`font-medium ${
                      stats.circuitBreakerOpen
                        ? "text-[#ef4444]"
                        : "text-[#10b981]"
                    }`}
                  >
                    {stats.circuitBreakerOpen ? "Open" : "Closed"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleClearCache}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#14b8a6] to-[#0891b2] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#14b8a6]/25 transition-all duration-300 transform hover:scale-[1.02]"
              >
                Clear Cache
              </button>
              <button
                onClick={handleResetApp}
                disabled={isResetting}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  showResetConfirm
                    ? "bg-gradient-to-r from-[#dc2626] to-[#b91c1c] text-white hover:shadow-lg hover:shadow-[#ef4444]/30"
                    : "bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:shadow-lg hover:shadow-[#ef4444]/25"
                } transform hover:scale-[1.02]`}
              >
                {isResetting
                  ? "Resetting..."
                  : showResetConfirm
                  ? "Confirm Reset"
                  : "Reset App"}
              </button>
            </div>

            {/* Intelligent caching subtitle */}
            <p className="text-center text-white/40 text-sm mt-4">
              Intelligent caching for seamless music playback
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
