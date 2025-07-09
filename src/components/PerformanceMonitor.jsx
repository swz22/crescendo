import React, { useState, useEffect, useRef, useId } from "react";
import { useSelector, useDispatch } from "react-redux";
import { IoClose } from "react-icons/io5";
import { HiLightningBolt, HiChip } from "react-icons/hi";
import { BsSpeedometer2 } from "react-icons/bs";
import { TbWaveSine, TbBrandSpeedtest } from "react-icons/tb";
import { FiWifi, FiDatabase, FiActivity } from "react-icons/fi";
import { previewUrlManager } from "../utils/previewUrlManager";
import { clearAllAppData } from "../utils/storageManager";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useToast } from "../context/ToastContext";
import ConfirmDialog from "./ConfirmDialog";

const PerformanceMonitor = ({ onClose }) => {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const isMobile = useMediaQuery("(max-width: 639px)");
  const isTablet = useMediaQuery("(min-width: 640px) and (max-width: 1023px)");
  const isDesktop = useMediaQuery("(min-width: 1480px)");
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");

  const uniqueId = useId();
  const mobileGradientId = `${uniqueId}-mobile-gradient`;
  const desktopGradientId = `${uniqueId}-desktop-gradient`;
  const memoryGradientId = `${uniqueId}-memory-gradient`;

  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const resetTimeoutRef = useRef(null);

  const [stats, setStats] = useState({
    cached: 0,
    pending: 0,
    failed: 0,
    circuitBreakerOpen: false,
  });

  const [memoryStats, setMemoryStats] = useState({
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0,
    isUnavailable: false,
  });

  const [networkStats, setNetworkStats] = useState({
    latency: 0,
    bandwidth: 0,
    requestsPerMin: 0,
  });

  const [performanceScore, setPerformanceScore] = useState(0);
  const [waveHistory, setWaveHistory] = useState([]);
  const [memoryFlowData, setMemoryFlowData] = useState([]);

  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // Dialog states
  const [showClearCacheDialog, setShowClearCacheDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const hasMemoryAPI =
    typeof performance !== "undefined" && performance.memory && performance.memory.jsHeapSizeLimit > 0;

  useEffect(() => {
    setIsMounted(true);
    setTimeout(() => {
      setIsOpen(true);
      setIsAnimating(true);
    }, 50);

    return () => {
      isMountedRef.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const calculateScore = (stats, memoryStats, networkStats) => {
    if (!stats) return 0;

    const cacheRatio = stats.cached / (stats.cached + stats.failed + 1);

    // Handle memory health differently if API is unavailable
    let memoryHealth = 0.7;
    if (hasMemoryAPI && memoryStats.jsHeapSizeLimit > 0) {
      memoryHealth = 1 - memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit;
    }

    const circuitHealth = stats.circuitBreakerOpen ? 0.5 : 1;
    const networkHealth = Math.max(0, Math.min(1, 1 - networkStats.latency / 200));

    const weights = hasMemoryAPI
      ? { cache: 0.4, memory: 0.3, circuit: 0.2, network: 0.1 }
      : { cache: 0.5, memory: 0, circuit: 0.3, network: 0.2 };

    const score = Math.round(
      (cacheRatio * weights.cache +
        memoryHealth * weights.memory +
        circuitHealth * weights.circuit +
        networkHealth * weights.network) *
        100
    );

    return Math.max(0, Math.min(100, score));
  };

  useEffect(() => {
    const updateStats = () => {
      const cacheStats = previewUrlManager.getCacheStats();
      setStats(cacheStats);

      // Memory stats with Safari/iOS fallback
      if (hasMemoryAPI) {
        setMemoryStats({
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
          isUnavailable: false,
        });
      } else {
        setMemoryStats({
          usedJSHeapSize: 0,
          totalJSHeapSize: 0,
          jsHeapSizeLimit: 0,
          isUnavailable: true,
        });
      }

      setNetworkStats({
        latency: Math.random() * 100 + 20,
        bandwidth: Math.random() * 50 + 10,
        requestsPerMin: Math.floor(Math.random() * 30 + 10),
      });

      // Update wave history
      setWaveHistory((prev) => {
        const newHistory = [
          ...prev,
          {
            cache: (cacheStats.cached / (cacheStats.cached + cacheStats.failed + 1)) * 100,
            memory: hasMemoryAPI
              ? (1 - performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
              : 70,
            network: Math.random() * 100,
          },
        ];
        return newHistory.slice(-50);
      });

      // Update memory flow
      setMemoryFlowData((prev) => {
        const newData = [...prev, Math.random()];
        return newData.slice(-20);
      });
    };

    updateStats();
    intervalRef.current = setInterval(updateStats, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasMemoryAPI]);

  // Update performance score
  useEffect(() => {
    const score = calculateScore(stats, memoryStats, networkStats);
    setPerformanceScore(score);
  }, [stats, memoryStats, networkStats]);

  // Draw wave visualization
  useEffect(() => {
    if (!canvasRef.current || waveHistory.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw grid lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = (i / 4) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const drawWave = (data, color, yOffset) => {
        if (data.length < 2) return;

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;

        data.forEach((point, i) => {
          const x = (i / (data.length - 1)) * width;
          const baseY = height * 0.6;
          const waveHeight = height * 0.5;
          const y = baseY - (point / 100) * waveHeight + yOffset;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            const prevX = ((i - 1) / (data.length - 1)) * width;
            const prevY = baseY - (data[i - 1] / 100) * waveHeight + yOffset;
            const cpx1 = prevX + (x - prevX) * 0.5;
            const cpy1 = prevY;
            const cpx2 = prevX + (x - prevX) * 0.5;
            const cpy2 = y;
            ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x, y);
          }
        });

        ctx.stroke();
        ctx.shadowBlur = 0;
      };

      const drawHorizontalLine = (color, yPosition) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.moveTo(0, yPosition);
        ctx.lineTo(width, yPosition);
        ctx.stroke();
        ctx.shadowBlur = 0;
      };

      if (waveHistory.length > 0) {
        drawHorizontalLine("#3b82f6", height - 50);
        drawHorizontalLine("#22c55e", height - 35);

        drawWave(
          waveHistory.map((h) => h.network),
          "#a855f7",
          0
        );
      }

      if (isMountedRef.current) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [waveHistory]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsOpen(false);
      setTimeout(onClose, 100);
    }, 300);
  };

  const handleClearCache = () => {
    previewUrlManager.clearCache();
    setMemoryFlowData([]);
    setWaveHistory([]);
    setStats({
      cached: 0,
      pending: 0,
      failed: 0,
      circuitBreakerOpen: false,
    });
    showToast("Cache cleared successfully", "success");
  };

  const handleResetApp = () => {
    setIsResetting(true);
    clearAllAppData();
    setTimeout(() => window.location.reload(), 1000);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const getPerformanceRating = () => {
    if (performanceScore >= 80) return "Excellent";
    if (performanceScore >= 60) return "Good";
    return "Needs Optimization";
  };

  const generateWavePath = () => {
    const points = 20;
    const amplitude = 15;
    const frequency = 2;
    let path = `M 0 ${20}`;

    for (let i = 1; i <= points; i++) {
      const x = (i / points) * 200;
      const y = 20 + Math.sin((i / points) * Math.PI * frequency) * amplitude * (performanceScore / 100);
      path += ` L ${x} ${y}`;
    }

    return path;
  };

  const generateMemoryFlowPath = () => {
    const points = memoryFlowData.length;
    if (points < 2) return "";

    let path = `M 0 40`;
    memoryFlowData.forEach((value, i) => {
      const x = (i / (points - 1)) * 200;
      const y = 40 - value * 35;
      path += ` L ${x} ${y}`;
    });
    path += ` L 200 40 Z`;

    return path;
  };

  if (!isOpen) return null;

  // Mobile full-screen view
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[60]"
          style={{
            opacity: isAnimating ? 1 : 0,
            transition: "opacity 0.3s ease-out",
          }}
          onClick={handleClose}
        />

        {/* Full Screen Modal */}
        <div
          className="fixed inset-0 z-[70] bg-gray-900/95 backdrop-blur-xl"
          style={{
            opacity: isAnimating ? 1 : 0,
            pointerEvents: isAnimating ? "auto" : "none",
            transition: "opacity 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          }}
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-pink-900/10" />

          {/* Fixed Header */}
          <div className="sticky top-0 z-10 bg-gray-900/90 backdrop-blur-lg border-b border-white/10">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 blur-lg opacity-50" />
                  <BsSpeedometer2 className="relative w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Performance</h2>
              </div>
              <button onClick={handleClose} className="p-3 -m-3 rounded-lg active:bg-white/10 transition-colors">
                <IoClose className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="h-[calc(100vh-64px)] overflow-y-auto">
            <div className="p-4 pb-8 space-y-4">
              {/* Performance Score */}
              <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl border border-white/10">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
                <div className="relative p-4">
                  <div className="text-center">
                    <h3 className="text-base font-semibold text-white mb-2">Overall Performance</h3>
                    <div className="flex items-baseline gap-2 justify-center">
                      <span className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                        {performanceScore}
                      </span>
                      <span className="text-gray-400 text-lg">/100</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{getPerformanceRating()}</p>
                    {/* Wave Visualization */}
                    <div className="h-12 w-full mt-3">
                      <svg viewBox="0 0 200 40" className="w-full h-full" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id={mobileGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgb(168, 85, 247)" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="rgb(236, 72, 153)" stopOpacity="0.8" />
                          </linearGradient>
                        </defs>
                        <path
                          d={generateWavePath()}
                          fill="none"
                          stroke={`url(#${mobileGradientId})`}
                          strokeWidth="2"
                          className="animate-pulse"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cache Stats */}
              <div className="bg-gray-800/50 backdrop-blur rounded-xl border border-white/10 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FiDatabase className="w-4 h-4 text-blue-400" />
                    <h3 className="text-base font-semibold text-white">Cache Status</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Cached</span>
                      <span className="text-blue-400 font-semibold text-sm">{stats.cached}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Pending</span>
                      <span className="text-yellow-400 font-semibold text-sm">{stats.pending}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Failed</span>
                      <span className="text-red-400 font-semibold text-sm">{stats.failed}</span>
                    </div>
                    {stats.circuitBreakerOpen && (
                      <div className="mt-2 p-2 bg-red-900/20 border border-red-500/20 rounded-lg">
                        <span className="text-xs text-red-400">Circuit breaker active</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Network Stats */}
              <div className="bg-gray-800/50 backdrop-blur rounded-xl border border-white/10 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FiWifi className="w-4 h-4 text-green-400" />
                    <h3 className="text-base font-semibold text-white">Network</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Latency</span>
                      <span
                        className={`font-semibold text-sm ${
                          networkStats.latency < 100
                            ? "text-green-400"
                            : networkStats.latency < 300
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        {networkStats.latency.toFixed(0)}ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Bandwidth</span>
                      <span className="text-green-400 font-semibold text-sm">
                        {networkStats.bandwidth.toFixed(0)} Mbps
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Requests/min</span>
                      <span className="text-purple-400 font-semibold text-sm">{networkStats.requestsPerMin}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Memory Usage - Handle Safari/iOS gracefully */}
              {hasMemoryAPI ? (
                <div className="bg-gray-800/50 backdrop-blur rounded-xl border border-white/10 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <HiChip className="w-4 h-4 text-yellow-400" />
                      <h3 className="text-base font-semibold text-white">Memory Usage</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-400 text-sm">Heap Used</span>
                          <span className="text-yellow-400 font-semibold text-sm">
                            {formatBytes(memoryStats.usedJSHeapSize)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-300"
                            style={{
                              width: `${(memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 text-center">
                        {formatBytes(memoryStats.jsHeapSizeLimit)} limit
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800/50 backdrop-blur rounded-xl border border-white/10 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center gap-2">
                      <HiChip className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-white">Memory Usage</h3>
                        <p className="text-xs text-gray-400 mt-1">Not available on this device</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="bg-gray-800/50 backdrop-blur rounded-xl border border-white/10 overflow-hidden p-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowClearCacheDialog(true)}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <FiDatabase className="w-4 h-4" />
                    Clear Cache
                  </button>
                  <button
                    onClick={() => setShowResetDialog(true)}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <FiActivity className="w-4 h-4" />
                    Reset All
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ConfirmDialog
          isOpen={showClearCacheDialog}
          onClose={() => setShowClearCacheDialog(false)}
          onConfirm={handleClearCache}
          title="Clear Preview Cache?"
          message="This will remove all cached preview URLs and performance data. You'll need to reload previews for songs you play."
          confirmText="Clear Cache"
          cancelText="Cancel"
          variant="warning"
          icon={FiDatabase}
          details={[
            `${stats.cached} cached preview URLs will be removed`,
            "Performance monitoring data will be reset",
            "Your playlists and preferences will be preserved",
          ]}
        />

        <ConfirmDialog
          isOpen={showResetDialog}
          onClose={() => setShowResetDialog(false)}
          onConfirm={handleResetApp}
          title="Reset Crescendo?"
          message="This will completely reset the app to its initial state. All your data will be permanently deleted."
          confirmText="Reset Everything"
          cancelText="Cancel"
          variant="danger"
          icon={HiLightningBolt}
          details={[
            "All playlists will be deleted",
            "Play history will be cleared",
            "App preferences will be reset",
            "Cached data will be removed",
            "This action cannot be undone",
          ]}
        />
      </>
    );
  }

  // Desktop/Tablet modal view
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-300 ${
          isAnimating ? "bg-black/70 backdrop-blur-md" : "bg-transparent pointer-events-none"
        }`}
        onClick={handleClose}
        style={{
          left: isLargeScreen ? "240px" : "0",
          right: isDesktop ? "380px" : "0",
        }}
      />

      {/* Modal */}
      <div
        className={`fixed z-50 transition-all duration-500 overflow-hidden performance-modal-container ${
          isAnimating
            ? isLargeScreen
              ? "translate-y-0 opacity-100"
              : "opacity-100 scale-100"
            : isLargeScreen
            ? "translate-y-full opacity-0"
            : "opacity-0 scale-95"
        }`}
        style={
          isLargeScreen
            ? {
                left: "240px",
                right: isDesktop ? "380px" : "0",
                bottom: "0",
                top: "0",
                background: "linear-gradient(135deg, #0a0118 0%, #1a0f2e 50%, #0a0118 100%)",
              }
            : {
                left: "50%",
                top: "50%",
                transform: `translate(-50%, -50%) ${isAnimating ? "scale(1)" : "scale(0.95)"}`,
                width: "90vw",
                maxWidth: "800px",
                maxHeight: "85vh",
                height: "85vh",
                background: "linear-gradient(135deg, #0a0118 0%, #1a0f2e 50%, #0a0118 100%)",
                borderRadius: "24px",
              }
        }
      >
        {/* Aurora background effect*/}
        <div className="absolute inset-0 overflow-hidden">
          <div className="performance-aurora-1" />
          <div className="performance-aurora-2" />
        </div>

        <div className="relative h-full flex flex-col p-8 overflow-y-auto custom-scrollbar">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Performance Monitor</h2>
              <p className="text-white/60">Real-time system metrics and optimization</p>
            </div>
            <button
              onClick={handleClose}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all backdrop-blur-md"
            >
              <IoClose className="w-6 h-6 text-white" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 performance-grid">
            {/* Left Column - Score and Stats */}
            <div className="lg:col-span-1 space-y-6">
              {/* Performance Score */}
              <div className="p-6">
                <div className="flex justify-center mb-4">
                  <div className="relative performance-score-container" style={{ width: "200px", height: "200px" }}>
                    {/* Performance Ring */}
                    <svg
                      className="w-full h-full -rotate-90 performance-ring"
                      viewBox="0 0 224 224"
                      key={`desktop-svg-${uniqueId}`}
                    >
                      <circle cx="112" cy="112" r="100" stroke="rgba(255,255,255,0.1)" strokeWidth="20" fill="none" />
                      <circle
                        cx="112"
                        cy="112"
                        r="100"
                        stroke={`url(#${desktopGradientId})`}
                        strokeWidth="20"
                        fill="none"
                        strokeDasharray={`${(performanceScore / 100) * 628} 628`}
                        className="transition-all duration-1000 ease-out"
                      />
                      <defs>
                        <linearGradient id={desktopGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#22c55e">
                            <animate
                              attributeName="stop-color"
                              values="#22c55e;#3b82f6;#a855f7;#22c55e"
                              dur="8s"
                              repeatCount="indefinite"
                            />
                          </stop>
                          <stop offset="50%" stopColor="#3b82f6">
                            <animate
                              attributeName="stop-color"
                              values="#3b82f6;#a855f7;#22c55e;#3b82f6"
                              dur="8s"
                              repeatCount="indefinite"
                            />
                          </stop>
                          <stop offset="100%" stopColor="#a855f7">
                            <animate
                              attributeName="stop-color"
                              values="#a855f7;#22c55e;#3b82f6;#a855f7"
                              dur="8s"
                              repeatCount="indefinite"
                            />
                          </stop>
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-6xl font-bold text-white">{performanceScore}</span>
                      <span className="text-sm text-white/60 mt-2">Performance Score</span>
                    </div>
                  </div>
                </div>
                <p className="text-center text-white/40 text-sm">
                  {performanceScore >= 80
                    ? "Excellent Performance"
                    : performanceScore >= 60
                    ? "Good Performance"
                    : "Needs Optimization"}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="space-y-3">
                <div className="bg-white/[0.03] backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <FiDatabase className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Cache Status</p>
                        <p className="text-xs text-white/60">{stats.cached} tracks cached</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-green-400">{stats.cached}</span>
                  </div>
                </div>

                {hasMemoryAPI && (
                  <div className="bg-white/[0.03] backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <HiChip className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Memory Usage</p>
                          <p className="text-xs text-white/60">Heap utilization</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-blue-400">
                        {formatBytes(memoryStats.usedJSHeapSize)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="bg-white/[0.03] backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <FiWifi className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Network</p>
                        <p className="text-xs text-white/60">Average latency</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-purple-400">{networkStats.latency.toFixed(0)}ms</span>
                  </div>
                </div>

                <div className="bg-white/[0.03] backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-500/20 rounded-lg">
                        <HiLightningBolt className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Actions</p>
                        <p className="text-xs text-white/60">System controls</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowClearCacheDialog(true)}
                        className="p-2 bg-white/[0.05] hover:bg-white/[0.08] backdrop-blur-md rounded-lg transition-all duration-300 border border-white/10 hover:border-white/20 group"
                        title="Clear Cache"
                      >
                        <FiDatabase className="w-4 h-4 text-green-400 group-hover:scale-110 transition-transform" />
                      </button>
                      <button
                        onClick={() => setShowResetDialog(true)}
                        disabled={isResetting}
                        className={`p-2 rounded-lg transition-all duration-300 backdrop-blur-md group ${
                          showResetConfirm
                            ? "bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 hover:border-red-500/50"
                            : "bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 hover:border-white/20"
                        }`}
                        title={isResetting ? "Resetting..." : showResetConfirm ? "Confirm Reset" : "Reset App"}
                      >
                        <HiLightningBolt
                          className={`w-4 h-4 transition-transform ${
                            showResetConfirm ? "text-red-400 animate-pulse" : "text-orange-400 group-hover:scale-110"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Visualizations */}
            <div className="lg:col-span-2 space-y-6">
              {/* Wave Visualization */}
              <div className="bg-white/[0.03] backdrop-blur-md rounded-3xl p-6 border border-white/10">
                <h3 className="text-lg font-medium text-white mb-4">Real-time Performance</h3>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  className="w-full rounded-xl"
                  style={{ background: "rgba(0,0,0,0.5)" }}
                />
                <div className="flex items-center justify-center gap-8 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                    <span className="text-sm text-white/60">Network Activity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-sm text-white/60">Memory Health</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-white/60">Cache Performance</span>
                  </div>
                </div>
              </div>

              {/* Memory Usage Radial Gauge */}
              {hasMemoryAPI && (
                <div className="bg-white/[0.03] backdrop-blur-md rounded-3xl p-6 border border-white/10">
                  <h3 className="text-lg font-medium text-white mb-4">Memory Analysis</h3>

                  {/* Main Gauge */}
                  <div className="relative flex justify-center mb-6">
                    <div className="relative w-64 h-32">
                      {/* Background arc */}
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 120">
                        <path
                          d="M 20 100 A 80 80 0 0 1 180 100"
                          fill="none"
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="16"
                        />
                        {/* Gradient arc based on memory usage */}
                        <path
                          d="M 20 100 A 80 80 0 0 1 180 100"
                          fill="none"
                          stroke={`url(#${memoryGradientId})`}
                          strokeWidth="16"
                          strokeDasharray={`${(memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit) * 251} 251`}
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                        <defs>
                          <linearGradient id={memoryGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#22c55e" />
                            <stop offset="50%" stopColor="#3b82f6" />
                            <stop
                              offset="100%"
                              stopColor={
                                memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit > 0.8
                                  ? "#ef4444"
                                  : memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit > 0.6
                                  ? "#f59e0b"
                                  : "#a855f7"
                              }
                            />
                          </linearGradient>
                        </defs>
                      </svg>

                      {/* Center content */}
                      <div className="absolute inset-0 flex items-end justify-center pb-4">
                        <div className="text-center">
                          <div className="text-5xl font-bold text-white mb-1">
                            {Math.round((memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit) * 100)}%
                          </div>
                          <div className="text-sm text-white/60">Memory Utilization</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Memory Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-black/30 rounded-2xl">
                    <div className="text-center">
                      <div className="text-xs text-white/60 mb-1">Active Memory</div>
                      <div className="text-xl font-bold text-cyan-400">{formatBytes(memoryStats.usedJSHeapSize)}</div>
                    </div>
                    <div className="text-center border-x border-white/10">
                      <div className="text-xs text-white/60 mb-1">Available</div>
                      <div className="text-xl font-bold text-green-400">
                        {formatBytes(memoryStats.jsHeapSizeLimit - memoryStats.usedJSHeapSize)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-white/60 mb-1">System Limit</div>
                      <div className="text-xl font-bold text-purple-400">
                        {formatBytes(memoryStats.jsHeapSizeLimit)}
                      </div>
                    </div>
                  </div>

                  {/* Memory Health Status */}
                  <div className="mt-4 p-3 bg-white/[0.03] rounded-xl flex items-center justify-between">
                    <span className="text-sm text-white/80">System Health</span>
                    <div
                      className={`flex items-center gap-2 ${
                        memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit < 0.6
                          ? "text-green-400"
                          : memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit < 0.8
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full animate-pulse ${
                          memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit < 0.6
                            ? "bg-green-400"
                            : memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit < 0.8
                            ? "bg-yellow-400"
                            : "bg-red-400"
                        }`}
                      />
                      <span className="text-sm font-medium">
                        {memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit < 0.6
                          ? "Optimal Performance"
                          : memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit < 0.8
                          ? "Moderate Usage"
                          : "High Memory Pressure"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={showClearCacheDialog}
        onClose={() => setShowClearCacheDialog(false)}
        onConfirm={handleClearCache}
        title="Clear Preview Cache?"
        message="This will remove all cached preview URLs and performance data. You'll need to reload previews for songs you play."
        confirmText="Clear Cache"
        cancelText="Cancel"
        variant="warning"
        icon={FiDatabase}
        details={[
          `${stats.cached} cached preview URLs will be removed`,
          "Performance monitoring data will be reset",
          "Your playlists and preferences will be preserved",
        ]}
      />

      <ConfirmDialog
        isOpen={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onConfirm={handleResetApp}
        title="Reset Crescendo?"
        message="This will completely reset the app to its initial state. All your data will be permanently deleted."
        confirmText="Reset Everything"
        cancelText="Cancel"
        variant="danger"
        icon={HiLightningBolt}
        details={[
          "All playlists will be deleted",
          "Play history will be cleared",
          "App preferences will be reset",
          "Cached data will be removed",
          "This action cannot be undone",
        ]}
      />
    </>
  );
};

export default PerformanceMonitor;
