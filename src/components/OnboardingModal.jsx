import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  HiOutlineSparkles,
  HiX,
  HiOutlineLightBulb,
  HiOutlinePlay,
  HiOutlineSearch,
  HiOutlineCollection,
  HiOutlineMenuAlt2,
  HiOutlineCog,
  HiOutlineCursorClick,
  HiOutlineGlobeAlt,
  HiOutlineChevronRight,
  HiOutlineChevronLeft,
  HiOutlineCheckCircle,
  HiOutlineLightningBolt,
} from "react-icons/hi";
import { StorageKeys } from "../utils/storageManager";
import { BsMusicNoteBeamed, BsShuffle, BsSpeedometer2 } from "react-icons/bs";
import { IoMdTime } from "react-icons/io";
import { RiDragDropLine } from "react-icons/ri";

// Create a custom event for triggering the modal
export const SHOW_ONBOARDING_EVENT = "showOnboardingModal";

export const showOnboardingModal = () => {
  window.dispatchEvent(new Event(SHOW_ONBOARDING_EVENT));
};

const OnboardingModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [animateStep, setAnimateStep] = useState(true);
  const openTimeoutRef = useRef(null);
  const stepTimeoutRef = useRef(null);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem(StorageKeys.ONBOARDING);
    if (!hasSeenOnboarding) {
      openTimeoutRef.current = setTimeout(() => setIsOpen(true), 800);
    }

    // Listen for manual trigger event
    const handleShowEvent = () => {
      setIsOpen(true);
      setCurrentStep(0);
    };

    window.addEventListener(SHOW_ONBOARDING_EVENT, handleShowEvent);

    return () => {
      window.removeEventListener(SHOW_ONBOARDING_EVENT, handleShowEvent);
      if (openTimeoutRef.current) {
        clearTimeout(openTimeoutRef.current);
        openTimeoutRef.current = null;
      }
      if (stepTimeoutRef.current) {
        clearTimeout(stepTimeoutRef.current);
        stepTimeoutRef.current = null;
      }
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    // Disable music keyboard shortcuts when modal is open
    window.musicShortcutsDisabled = true;

    const handleKeyPress = (e) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          prevStep();
          break;
        case "ArrowRight":
          e.preventDefault();
          nextStep();
          break;
        case "Escape":
          e.preventDefault();
          handleClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      // Re-enable music keyboard shortcuts
      window.musicShortcutsDisabled = false;
    };
  }, [isOpen, currentStep]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(StorageKeys.ONBOARDING, "true");
  };

  const nextStep = () => {
    if (currentStep < features.length - 1) {
      setAnimateStep(false);
      // Clear any existing timeout
      if (stepTimeoutRef.current) {
        clearTimeout(stepTimeoutRef.current);
      }

      stepTimeoutRef.current = setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setAnimateStep(true);
        stepTimeoutRef.current = null;
      }, 100);
    } else {
      handleClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setAnimateStep(false);
      if (stepTimeoutRef.current) {
        clearTimeout(stepTimeoutRef.current);
      }

      stepTimeoutRef.current = setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setAnimateStep(true);
        stepTimeoutRef.current = null;
      }, 100);
    }
  };

  const features = [
    {
      icon: HiOutlineSparkles,
      title: "Welcome to Crescendo",
      description:
        "A premium music streaming experience showcasing modern web development. Let me show you what makes this app stand out.",
      highlights: [
        "30-second Spotify previews - no login required",
        "Built with React, Redux, and Tailwind CSS",
        "100% responsive design with adaptive layouts",
        "Real-time performance monitoring built-in",
      ],
      color: "from-[#14b8a6] to-[#0891b2]",
      glow: "shadow-[#14b8a6]/50",
    },
    {
      icon: HiOutlineLightningBolt,
      title: "Performance Optimizations",
      description:
        "Built with performance in mind. The app pre-caches data intelligently and handles errors gracefully to provide a smooth experience.",
      highlights: [
        "Preview URL caching reduces load times",
        "Audio preloading on hover when possible",
        "Request deduplication prevents API spam",
        "Performance monitor shows real-time metrics",
      ],
      color: "from-[#0891b2] to-[#0d9488]",
      glow: "shadow-[#0891b2]/50",
    },
    {
      icon: RiDragDropLine,
      title: "Queue Management",
      description:
        "A fully-featured queue system with drag & drop support. Reorder your music on any device with smooth animations.",
      highlights: [
        "Drag & drop reordering (mouse + touch)",
        "Multiple contexts: Queue, Albums, Playlists",
        "Context switching with dropdown menu",
        "Queue persists across browser sessions",
      ],
      color: "from-[#6366f1] to-[#8b5cf6]",
      glow: "shadow-[#6366f1]/50",
    },
    {
      icon: BsMusicNoteBeamed,
      title: "Playlist Features",
      description:
        "Create and manage your own playlists with a polished interface. Each playlist automatically generates unique artwork.",
      highlights: [
        "Dynamic 4-image mosaic artwork",
        "Inline rename & delete with confirmations",
        "Full-screen playlist modal on mobile",
        "Add entire playlists to queue",
      ],
      color: "from-[#ec4899] to-[#f43f5e]",
      glow: "shadow-[#ec4899]/50",
    },
    {
      icon: HiOutlineCursorClick,
      title: "Power User Features",
      description: "Keyboard shortcuts and developer-friendly features make the app feel professional and polished.",
      highlights: [
        "Keyboard navigation (Space, Arrows, M)",
        "Real-time performance monitoring",
        "Toast notifications with progress bars",
        "Error boundaries for stability",
      ],
      color: "from-[#fb923c] to-[#dc2626]",
      glow: "shadow-[#fb923c]/50",
    },
    {
      icon: HiOutlineGlobeAlt,
      title: "Music Discovery",
      description:
        "Explore music from around the world with smart filtering and responsive layouts that adapt to any screen size.",
      highlights: [
        "16+ genre categories with custom icons",
        "Top Artists/Albums from 15+ countries",
        "Community playlists from Spotify",
        "Search across songs, artists, and albums",
      ],
      color: "from-[#3b82f6] to-[#1d4ed8]",
      glow: "shadow-[#3b82f6]/50",
    },
    {
      icon: BsSpeedometer2,
      title: "Technical Implementation",
      description:
        "Built with modern React patterns and production-ready code structure. The Performance Monitor lets you peek under the hood.",
      highlights: [
        "20+ custom React hooks for reusability",
        "Redux with persistence & selectors",
        "Portal-based modals & dropdowns",
        "Spotify API with preview workaround",
      ],
      color: "from-[#7c3aed] to-[#a855f7]",
      glow: "shadow-[#7c3aed]/50",
    },
  ];

  const currentFeature = features[currentStep];

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={handleClose} />

      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-[#14b8a6] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#0891b2] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-40 left-40 w-80 h-80 bg-[#7c3aed] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Modal */}
      <div
        className={`relative w-full max-w-2xl bg-gradient-to-br from-[#1e1b4b]/98 to-[#0f172a]/98 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden transition-all duration-500 ${
          animateStep ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
        }`}
      >
        {/* Gradient border effect */}
        <div className="absolute inset-0 rounded-3xl p-[1px] bg-gradient-to-r from-[#14b8a6] via-[#7c3aed] to-[#ec4899] opacity-30" />

        <div className="relative bg-black/60 backdrop-blur-xl rounded-3xl p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              {features.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    index === currentStep
                      ? "w-8 bg-gradient-to-r " + currentFeature.color
                      : index < currentStep
                      ? "w-1.5 bg-white/60"
                      : "w-1.5 bg-white/20"
                  }`}
                />
              ))}
            </div>
            <button onClick={handleClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors group">
              <HiX className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-8">
            {/* Icon */}
            <div
              className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${currentFeature.color} mb-6 ${currentFeature.glow} shadow-lg`}
            >
              <currentFeature.icon className="w-8 h-8 text-white" />
            </div>

            {/* Title and Description */}
            <h2 className="text-3xl font-bold text-white mb-3">{currentFeature.title}</h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-6">{currentFeature.description}</p>

            {/* Highlights */}
            <div className="space-y-3">
              {currentFeature.highlights.map((highlight, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 transition-all duration-500 ${
                    animateStep ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div
                    className={`mt-1 w-5 h-5 rounded-full bg-gradient-to-br ${currentFeature.color} flex items-center justify-center flex-shrink-0`}
                  >
                    <HiOutlineCheckCircle className="w-3 h-3 text-white" />
                  </div>
                  <p className="text-gray-300">{highlight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                currentStep === 0
                  ? "bg-gray-800/50 text-gray-500 cursor-not-allowed border border-gray-700"
                  : `bg-gradient-to-r ${currentFeature.color} text-white hover:shadow-lg ${currentFeature.glow} hover:shadow-xl`
              }`}
            >
              <HiOutlineChevronLeft className="w-5 h-5" />
              <span>Previous</span>
            </button>

            {/* Keyboard hints */}
            <div className="hidden sm:flex items-center gap-2 text-s text-gray-500">
              <span>← → to Navigate</span>
              <span className="text-gray-600">•</span>
              <span>ESC to Close</span>
            </div>

            <button
              onClick={nextStep}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all bg-gradient-to-r ${currentFeature.color} text-white hover:shadow-lg ${currentFeature.glow} hover:shadow-xl transform hover:scale-105`}
            >
              <span>{currentStep === features.length - 1 ? "Get Started" : "Next Feature"}</span>
              <HiOutlineChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Actions */}
          {currentStep === features.length - 1 && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-center text-gray-400 mb-4">Want to see this tour again?</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    localStorage.removeItem(StorageKeys.ONBOARDING);
                    handleClose();
                  }}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Reset and show on next visit
                </button>
                <span className="text-gray-600">•</span>
                <button onClick={handleClose} className="text-sm text-gray-400 hover:text-white transition-colors">
                  Don't show again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default OnboardingModal;
