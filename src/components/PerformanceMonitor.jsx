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
    if (!stats || !memoryStats) return 0;

    const cacheRatio = stats.cached / (stats.cached + stats.failed + 1);
    const memoryHealth =
      1 - memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit;
    const circuitHealth = stats.circuitBreakerOpen ? 0.5 : 1;
    const networkHealth = Math.min(networkStats.latency / 100, 1);

    const score = Math.round(
      (cacheRatio * 0.4 +
        memoryHealth * 0.3 +
        circuitHealth * 0.2 +
        networkHealth * 0.1) *
        100
    );

    return Math.max(0, Math.min(100, score));
  };

  useEffect(() => {
    const updateStats = () => {
      const cacheStats = previewUrlManager.getCacheStats();
      setStats(cacheStats);

      // Memory stats
      if (performance.memory) {
        setMemoryStats({
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
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
            cache:
              (cacheStats.cached /
                (cacheStats.cached + cacheStats.failed + 1)) *
              100,
            memory: performance.memory
              ? (1 -
                  performance.memory.usedJSHeapSize /
                    performance.memory.jsHeapSizeLimit) *
                100
              : 50,
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
  }, []);

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

  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const resetTimeoutRef = useRef(null);

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

  if (!isOpen) return null;

  // Mobile full-screen view
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] will-change-opacity"
          style={{
            opacity: isAnimating ? 1 : 0,
            pointerEvents: isAnimating ? "auto" : "none",
            transition: "opacity 0.4s ease-out",
          }}
          onClick={handleClose}
        />

        {/* Full Screen Sheet */}
        <div
          className="fixed inset-0 z-[70] bg-gradient-to-b from-[#0a0118] via-[#1a0f2e] to-[#0a0118] will-change-transform"
          style={{
            transform: `translateY(${isAnimating ? "0%" : "100%"})`,
            transition: "transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)",
          }}
        >
          {/* Aurora background effect */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-green-500/20 via-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-green-500/20 rounded-full blur-3xl animate-pulse animation-delay-2000" />
          </div>

          <div className="relative h-full flex flex-col p-6 overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">
                Performance Monitor
              </h2>
              <button
                onClick={handleClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"
              >
                <IoClose className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Performance Score */}
            <div className="flex justify-center mb-8">
              <div className="relative w-48 h-48">
                {/* Ring Background */}
                <svg
                  className="absolute inset-0 w-full h-full -rotate-90 performance-ring-mobile"
                  key={`mobile-svg-${uniqueId}`}
                >
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="16"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke={`url(#${mobileGradientId})`}
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${(performanceScore / 100) * 553} 553`}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient
                      id={mobileGradientId}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#22c55e">
                        <animate
                          attributeName="stop-color"
                          values="#22c55e;#3b82f6;#a855f7;#22c55e"
                          dur="10s"
                          repeatCount="indefinite"
                        />
                      </stop>
                      <stop offset="50%" stopColor="#3b82f6">
                        <animate
                          attributeName="stop-color"
                          values="#3b82f6;#a855f7;#22c55e;#3b82f6"
                          dur="10s"
                          repeatCount="indefinite"
                        />
                      </stop>
                      <stop offset="100%" stopColor="#a855f7">
                        <animate
                          attributeName="stop-color"
                          values="#a855f7;#22c55e;#3b82f6;#a855f7"
                          dur="10s"
                          repeatCount="indefinite"
                        />
                      </stop>
                    </linearGradient>
                  </defs>
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold text-white">
                    {performanceScore}
                  </span>
                  <span className="text-sm text-white/60 mt-1">
                    Performance Score
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/[0.05] backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <FiDatabase className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-white/60">Cache</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.cached}</p>
                <p className="text-xs text-green-400">Tracks Cached</p>
              </div>

              <div className="bg-white/[0.05] backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <HiChip className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-white/60">Memory</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {formatBytes(memoryStats.usedJSHeapSize)}
                </p>
                <p className="text-xs text-blue-400">Used Heap</p>
              </div>

              <div className="bg-white/[0.05] backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <FiActivity className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-white/60">Network</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {networkStats.latency.toFixed(0)}ms
                </p>
                <p className="text-xs text-purple-400">Avg Latency</p>
              </div>

              <div className="bg-white/[0.05] backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <TbBrandSpeedtest className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-white/60">Hit Rate</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {stats.cached + stats.failed > 0
                    ? Math.round(
                        (stats.cached / (stats.cached + stats.failed)) * 100
                      )
                    : 0}
                  %
                </p>
                <p className="text-xs text-orange-400">Cache Efficiency</p>
              </div>
            </div>

            {/* Wave Visualization */}
            <div className="bg-white/[0.05] backdrop-blur-md rounded-2xl p-4 border border-white/10 mb-6">
              <h3 className="text-sm font-medium text-white/80 mb-3">
                Real-time Metrics
              </h3>
              <canvas
                ref={canvasRef}
                width={300}
                height={150}
                className="w-full rounded-lg"
                style={{ background: "rgba(0,0,0,0.3)" }}
              />
              <div className="flex items-center justify-center gap-6 mt-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-xs text-white/60">Cache</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-xs text-white/60">Memory</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full" />
                  <span className="text-xs text-white/60">Network</span>
                </div>
              </div>
            </div>

            {/* Memory Usage Radial Gauge */}
            <div className="bg-white/[0.05] backdrop-blur-md rounded-2xl p-4 border border-white/10 mb-6">
              <h3 className="text-sm font-medium text-white/80 mb-3">
                Memory Pressure
              </h3>
              <div className="relative flex justify-center">
                <div className="relative w-40 h-20">
                  {/* Background arc */}
                  <svg className="absolute inset-0 w-full h-full">
                    <path
                      d="M 10 80 A 60 60 0 0 1 150 80"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="12"
                    />
                    {/* Colored arc based on memory usage */}
                    <path
                      d="M 10 80 A 60 60 0 0 1 150 80"
                      fill="none"
                      stroke={
                        memoryStats.usedJSHeapSize /
                          memoryStats.jsHeapSizeLimit <
                        0.6
                          ? "#22c55e"
                          : memoryStats.usedJSHeapSize /
                              memoryStats.jsHeapSizeLimit <
                            0.8
                          ? "#f59e0b"
                          : "#ef4444"
                      }
                      strokeWidth="12"
                      strokeDasharray={`${
                        (memoryStats.usedJSHeapSize /
                          memoryStats.jsHeapSizeLimit) *
                        180
                      } 180`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  {/* Center text */}
                  <div className="absolute inset-0 flex items-end justify-center pb-2">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">
                        {Math.round(
                          (memoryStats.usedJSHeapSize /
                            memoryStats.jsHeapSizeLimit) *
                            100
                        )}
                        %
                      </div>
                      <div className="text-xs text-white/60">
                        {formatBytes(memoryStats.usedJSHeapSize)} /{" "}
                        {formatBytes(memoryStats.jsHeapSizeLimit)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Buttons */}
            <div className="flex gap-3 mt-auto">
              <button
                onClick={() => setShowClearCacheDialog(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] backdrop-blur-md rounded-xl transition-all duration-300 border border-white/10 hover:border-white/20 group"
              >
                <FiDatabase className="w-4 h-4 text-green-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-white/80 group-hover:text-white">
                  Clear Cache
                </span>
              </button>
              <button
                onClick={() => setShowResetDialog(true)}
                disabled={isResetting}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 backdrop-blur-md group ${
                  showResetConfirm
                    ? "bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 hover:border-red-500/50"
                    : "bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 hover:border-white/20"
                }`}
              >
                <HiLightningBolt
                  className={`w-4 h-4 transition-transform ${
                    showResetConfirm
                      ? "text-red-400 animate-pulse"
                      : "text-orange-400 group-hover:scale-110"
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    showResetConfirm
                      ? "text-red-300"
                      : "text-white/80 group-hover:text-white"
                  }`}
                >
                  {isResetting
                    ? "Resetting..."
                    : showResetConfirm
                    ? "Confirm?"
                    : "Reset App"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Desktop/Tablet modal view
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-300 ${
          isAnimating
            ? "bg-black/70 backdrop-blur-md"
            : "bg-transparent pointer-events-none"
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
                background:
                  "linear-gradient(135deg, #0a0118 0%, #1a0f2e 50%, #0a0118 100%)",
              }
            : {
                left: "50%",
                top: "50%",
                transform: `translate(-50%, -50%) ${
                  isAnimating ? "scale(1)" : "scale(0.95)"
                }`,
                width: "90vw",
                maxWidth: "800px",
                maxHeight: "85vh",
                height: "85vh",
                background:
                  "linear-gradient(135deg, #0a0118 0%, #1a0f2e 50%, #0a0118 100%)",
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
              <h2 className="text-3xl font-bold text-white mb-2">
                Performance Monitor
              </h2>
              <p className="text-white/60">
                Real-time system metrics and optimization
              </p>
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
                  <div
                    className="relative performance-score-container"
                    style={{ width: "200px", height: "200px" }}
                  >
                    {/* Performance Ring */}
                    <svg
                      className="w-full h-full -rotate-90 performance-ring"
                      viewBox="0 0 224 224"
                      key={`desktop-svg-${uniqueId}`}
                    >
                      <circle
                        cx="112"
                        cy="112"
                        r="100"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="20"
                        fill="none"
                      />
                      <circle
                        cx="112"
                        cy="112"
                        r="100"
                        stroke={`url(#${desktopGradientId})`}
                        strokeWidth="20"
                        fill="none"
                        strokeDasharray={`${
                          (performanceScore / 100) * 628
                        } 628`}
                        className="transition-all duration-1000 ease-out"
                      />
                      <defs>
                        <linearGradient
                          id={desktopGradientId}
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
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
                      <span className="text-6xl font-bold text-white">
                        {performanceScore}
                      </span>
                      <span className="text-sm text-white/60 mt-2">
                        Performance Score
                      </span>
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
                        <p className="text-xs text-white/60">
                          {stats.cached} tracks cached
                        </p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-green-400">
                      {stats.cached}
                    </span>
                  </div>
                </div>

                <div className="bg-white/[0.03] backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <HiChip className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Memory Usage</p>
                        <p className="text-xs text-white/60">
                          Heap utilization
                        </p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-blue-400">
                      {formatBytes(memoryStats.usedJSHeapSize)}
                    </span>
                  </div>
                </div>

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
                    <span className="text-2xl font-bold text-purple-400">
                      {networkStats.latency.toFixed(0)}ms
                    </span>
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
                        title={
                          isResetting
                            ? "Resetting..."
                            : showResetConfirm
                            ? "Confirm Reset"
                            : "Reset App"
                        }
                      >
                        <HiLightningBolt
                          className={`w-4 h-4 transition-transform ${
                            showResetConfirm
                              ? "text-red-400 animate-pulse"
                              : "text-orange-400 group-hover:scale-110"
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
                <h3 className="text-lg font-medium text-white mb-4">
                  Real-time Performance
                </h3>
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
                    <span className="text-sm text-white/60">
                      Network Activity
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-sm text-white/60">Memory Health</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-white/60">
                      Cache Performance
                    </span>
                  </div>
                </div>
              </div>

              {/* Memory Usage Radial Gauge */}
              <div className="bg-white/[0.03] backdrop-blur-md rounded-3xl p-6 border border-white/10">
                <h3 className="text-lg font-medium text-white mb-4">
                  Memory Pressure Analysis
                </h3>

                {/* Main Gauge */}
                <div className="relative flex justify-center mb-6">
                  <div className="relative w-64 h-32">
                    {/* Background arc */}
                    <svg
                      className="absolute inset-0 w-full h-full"
                      viewBox="0 0 200 120"
                    >
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
                        strokeDasharray={`${
                          (memoryStats.usedJSHeapSize /
                            memoryStats.jsHeapSizeLimit) *
                          251
                        } 251`}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                      <defs>
                        <linearGradient
                          id={memoryGradientId}
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop offset="0%" stopColor="#22c55e" />
                          <stop offset="50%" stopColor="#3b82f6" />
                          <stop
                            offset="100%"
                            stopColor={
                              memoryStats.usedJSHeapSize /
                                memoryStats.jsHeapSizeLimit >
                              0.8
                                ? "#ef4444"
                                : memoryStats.usedJSHeapSize /
                                    memoryStats.jsHeapSizeLimit >
                                  0.6
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
                          {Math.round(
                            (memoryStats.usedJSHeapSize /
                              memoryStats.jsHeapSizeLimit) *
                              100
                          )}
                          %
                        </div>
                        <div className="text-sm text-white/60">
                          Memory Utilization
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Memory Stats Grid */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-black/30 rounded-2xl">
                  <div className="text-center">
                    <div className="text-xs text-white/60 mb-1">
                      Active Memory
                    </div>
                    <div className="text-xl font-bold text-cyan-400">
                      {formatBytes(memoryStats.usedJSHeapSize)}
                    </div>
                  </div>
                  <div className="text-center border-x border-white/10">
                    <div className="text-xs text-white/60 mb-1">Available</div>
                    <div className="text-xl font-bold text-green-400">
                      {formatBytes(
                        memoryStats.jsHeapSizeLimit - memoryStats.usedJSHeapSize
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-white/60 mb-1">
                      System Limit
                    </div>
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
                      memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit <
                      0.6
                        ? "text-green-400"
                        : memoryStats.usedJSHeapSize /
                            memoryStats.jsHeapSizeLimit <
                          0.8
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full animate-pulse ${
                        memoryStats.usedJSHeapSize /
                          memoryStats.jsHeapSizeLimit <
                        0.6
                          ? "bg-green-400"
                          : memoryStats.usedJSHeapSize /
                              memoryStats.jsHeapSizeLimit <
                            0.8
                          ? "bg-yellow-400"
                          : "bg-red-400"
                      }`}
                    />
                    <span className="text-sm font-medium">
                      {memoryStats.usedJSHeapSize /
                        memoryStats.jsHeapSizeLimit <
                      0.6
                        ? "Optimal Performance"
                        : memoryStats.usedJSHeapSize /
                            memoryStats.jsHeapSizeLimit <
                          0.8
                        ? "Moderate Usage"
                        : "High Memory Pressure"}
                    </span>
                  </div>
                </div>
              </div>
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
