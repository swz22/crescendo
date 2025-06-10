import { useState, useEffect } from "react";
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
import { BsMusicNoteBeamed, BsShuffle, BsSpeedometer2 } from "react-icons/bs";
import { IoMdTime } from "react-icons/io";

const STORAGE_KEY = "crescendo_onboarding_seen";

// Create a custom event for triggering the modal
export const SHOW_ONBOARDING_EVENT = "showOnboardingModal";

export const showOnboardingModal = () => {
  window.dispatchEvent(new Event(SHOW_ONBOARDING_EVENT));
};

const OnboardingModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [animateStep, setAnimateStep] = useState(true);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem(STORAGE_KEY);
    if (!hasSeenOnboarding) {
      // Small delay for better UX
      setTimeout(() => setIsOpen(true), 800);
    }

    // Listen for manual trigger event
    const handleShowEvent = () => {
      setIsOpen(true);
      setCurrentStep(0);
    };

    window.addEventListener(SHOW_ONBOARDING_EVENT, handleShowEvent);

    return () => {
      window.removeEventListener(SHOW_ONBOARDING_EVENT, handleShowEvent);
    };
  }, []);
  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const nextStep = () => {
    if (currentStep < features.length - 1) {
      setAnimateStep(false);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setAnimateStep(true);
      }, 100);
    } else {
      handleClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setAnimateStep(false);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setAnimateStep(true);
      }, 100);
    }
  };

  const features = [
    {
      icon: HiOutlineSparkles,
      title: "Welcome to Crescendo",
      description:
        "A premium music streaming experience built to showcase modern web development. Let me show you the hidden features that make this portfolio stand out.",
      highlights: [
        "30-second Spotify previews - no login required",
        "Built with React, Redux, and Tailwind CSS",
        "Real-time audio caching for instant playback",
      ],
      color: "from-[#14b8a6] to-[#0891b2]",
      glow: "shadow-[#14b8a6]/50",
    },
    {
      icon: HiOutlineLightningBolt,
      title: "Performance Optimizations",
      description:
        "Notice how fast everything loads? Every interaction is optimized for speed.",
      highlights: [
        "Hover over any song to pre-cache audio",
        "Look for ⚡ icons - instant playback ready",
        "Smart prefetching prevents rate limiting",
        "Click the gear icon (bottom left) to see cache stats",
      ],
      color: "from-[#0891b2] to-[#0e7490]",
      glow: "shadow-[#0891b2]/50",
    },
    {
      icon: HiOutlineCursorClick,
      title: "Hidden Navigation Features",
      description:
        "Every element is interactive - explore these hidden navigation paths:",
      highlights: [
        "Click artist names → Artist details page",
        "Click song titles → Song details with lyrics links",
        "Click album names → Full album with all tracks",
        "Click 'View Album' in the player → Album page",
      ],
      color: "from-[#0e7490] to-[#164e63]",
      glow: "shadow-[#0e7490]/50",
    },
    {
      icon: HiOutlineMenuAlt2,
      title: "Advanced Queue Management",
      description:
        "The right sidebar is your personal DJ booth with powerful features:",
      highlights: [
        "Songs automatically add to your queue",
        "Create custom playlists (dropdown at top)",
        "Queue persists across navigation",
        "Shuffle & repeat controls in the player",
      ],
      color: "from-[#164e63] to-[#155e75]",
      glow: "shadow-[#164e63]/50",
    },
    {
      icon: HiOutlineCollection,
      title: "Community Playlists",
      description:
        "Load entire Spotify playlists instantly - try the featured 'Lonely Heart Radio'!",
      highlights: [
        "50+ track playlists load seamlessly",
        "Custom mosaic artwork for each playlist",
        "Smooth playlist modal with search",
        "Try spam-clicking next/prev - no delays!",
      ],
      color: "from-[#155e75] to-[#1e40af]",
      glow: "shadow-[#155e75]/50",
    },
    {
      icon: HiOutlineGlobeAlt,
      title: "Global Discovery Features",
      description: "Explore music from around the world with smart filtering:",
      highlights: [
        "Genre selector with 20+ categories",
        "Top Artists by country (15 regions)",
        "New album releases updated daily",
        "Search works across songs, artists, albums",
      ],
      color: "from-[#1e40af] to-[#7c3aed]",
      glow: "shadow-[#1e40af]/50",
    },
    {
      icon: BsSpeedometer2,
      title: "Technical Achievements",
      description: "Built with modern best practices and attention to detail:",
      highlights: [
        "Custom audio preloading system",
        "Spotify Web API with preview workaround",
        "Redux state management",
        "Responsive design (try resizing!)",
        "60fps animations throughout",
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
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-[#14b8a6] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#0891b2] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-40 left-40 w-80 h-80 bg-[#7c3aed] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Modal */}
      <div
        className={`relative w-full max-w-2xl bg-gradient-to-br from-[#1e1b4b]/98 to-[#0f172a]/98 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden transition-all duration-500 ${
          animateStep ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-[#14b8a6] to-[#0891b2] transition-all duration-500"
            style={{ width: `${((currentStep + 1) / features.length) * 100}%` }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all z-10"
        >
          <HiX className="w-5 h-5 text-white" />
        </button>

        {/* Content */}
        <div className="p-8 pt-12">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {features.map((_, index) => (
              <div
                key={index}
                className={`transition-all duration-300 ${
                  index === currentStep
                    ? "w-8 h-2 bg-gradient-to-r from-[#14b8a6] to-[#0891b2] rounded-full"
                    : index < currentStep
                    ? "w-2 h-2 bg-[#14b8a6] rounded-full"
                    : "w-2 h-2 bg-white/20 rounded-full"
                }`}
              />
            ))}
          </div>

          {/* Icon with glow effect */}
          <div className="flex justify-center mb-6">
            <div
              className={`relative p-6 bg-gradient-to-br ${
                currentFeature.color
              } rounded-2xl shadow-2xl ${
                currentFeature.glow
              } transform rotate-3 transition-all duration-500 ${
                animateStep ? "scale-100 rotate-3" : "scale-90 rotate-0"
              }`}
            >
              <currentFeature.icon className="w-12 h-12 text-white" />
              {/* Pulse animation */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl animate-pulse" />
            </div>
          </div>

          {/* Title and description */}
          <h2
            className={`text-3xl font-bold text-center bg-gradient-to-r ${
              currentFeature.color
            } bg-clip-text text-transparent mb-4 transition-all duration-500 ${
              animateStep
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
          >
            {currentFeature.title}
          </h2>

          <p
            className={`text-gray-300 text-center mb-8 text-lg leading-relaxed transition-all duration-500 delay-100 ${
              animateStep
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
          >
            {currentFeature.description}
          </p>

          {/* Highlights */}
          <div className="space-y-3 mb-8">
            {currentFeature.highlights.map((highlight, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 transition-all duration-500 ${
                  animateStep
                    ? "translate-x-0 opacity-100"
                    : "translate-x-8 opacity-0"
                }`}
                style={{ transitionDelay: `${(index + 2) * 100}ms` }}
              >
                <HiOutlineCheckCircle className="w-5 h-5 text-[#14b8a6] mt-0.5 flex-shrink-0" />
                <p className="text-white/90 text-sm">{highlight}</p>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              className={`px-4 py-2 text-white/60 hover:text-white transition-all flex items-center gap-2 ${
                currentStep === 0 ? "invisible" : ""
              }`}
            >
              <HiOutlineChevronLeft />
              Back
            </button>

            <button
              onClick={currentStep === 0 ? handleClose : undefined}
              className="text-white/40 hover:text-white/60 text-sm transition-all"
            >
              {currentStep === 0
                ? "Skip tour"
                : `${currentStep + 1} of ${features.length}`}
            </button>

            <button
              onClick={nextStep}
              className="px-6 py-2.5 bg-gradient-to-r from-[#14b8a6] to-[#0891b2] text-white rounded-full font-medium transition-all hover:shadow-lg hover:scale-105 flex items-center gap-2"
            >
              {currentStep === features.length - 1 ? "Get Started" : "Next"}
              <HiOutlineChevronRight />
            </button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-[#14b8a6]/20 to-[#0891b2]/20 rounded-full blur-3xl" />
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-[#7c3aed]/20 to-[#a855f7]/20 rounded-full blur-3xl" />
      </div>
    </div>,
    document.body
  );
};

export default OnboardingModal;
