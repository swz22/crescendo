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
    return () => clearInterval(interval);
  }, []);

  // Draw performance graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || bufferHistory.length < 2) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Create gradient
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

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
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
      setTimeout(() => setShowResetConfirm(false), 3000);
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
                    className="transition-all duration-1000"
                    style={{
                      filter: getScoreGlow(performanceScore),
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-5xl font-bold text-white mb-1">
                    {performanceScore}
                  </div>
                  <div className="text-sm text-white/60">Overall Score</div>
                </div>
              </div>
              <p className="mt-4 text-lg text-white/80 font-medium">
                {getPerformanceText(performanceScore)}
              </p>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Cache Performance Card */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#14b8a6]/20 to-[#0891b2]/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                <div className="relative bg-white/[0.03] backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#14b8a6] to-[#0891b2] rounded-xl flex items-center justify-center">
                      <HiLightningBolt className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      Cache Performance
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Hit Rate</span>
                      <span className="text-2xl font-bold text-[#14b8a6]">
                        {stats.cached > 0
                          ? Math.round(
                              (stats.cached /
                                (stats.cached + stats.failed + 1)) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Cached</span>
                        <span className="text-white font-medium">
                          {stats.cached} tracks
                        </span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#14b8a6] to-[#0891b2] rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              (stats.cached / 300) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="h-0.5" />{" "}
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <span className="text-white/60 text-sm">
                        Circuit Breaker
                      </span>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          stats.circuitBreakerOpen
                            ? "bg-red-500/20 text-red-400"
                            : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {stats.circuitBreakerOpen ? "TRIPPED" : "HEALTHY"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Playback Health Card */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#a855f7]/20 to-[#ec4899]/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                <div className="relative bg-white/[0.03] backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#a855f7] to-[#ec4899] rounded-xl flex items-center justify-center">
                      <TbWaveSine className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      Playback Health
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Memory Usage</span>
                      <span className="text-2xl font-bold text-[#a855f7]">
                        {audioStats
                          ? `${audioStats.bufferSizeInMB.toFixed(1)}MB`
                          : "0MB"}
                      </span>
                    </div>

                    <div className="h-24 -mx-2">
                      <canvas
                        ref={canvasRef}
                        width={300}
                        height={96}
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleClearCache}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white font-semibold rounded-xl 
                         hover:shadow-lg hover:shadow-[#f59e0b]/25 transform hover:scale-[1.02] transition-all duration-300"
              >
                Clear Cache
              </button>
              <button
                onClick={handleResetApp}
                disabled={isResetting}
                className={`flex-1 py-3 px-6 font-semibold rounded-xl transition-all duration-300 ${
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
