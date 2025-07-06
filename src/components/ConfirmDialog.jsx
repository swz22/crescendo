import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { HiExclamation, HiTrash } from "react-icons/hi";
import { IoWarning } from "react-icons/io5";
import { FiDatabase, FiAlertCircle } from "react-icons/fi";

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
  icon,
  details = [],
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const isMobile = useMediaQuery("(max-width: 640px)");

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimating(true), 50);
      setTimeout(() => setShowContent(true), 100);
    } else {
      setShowContent(false);
      setIsAnimating(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setShowContent(false);
    setIsAnimating(false);
    setTimeout(onClose, 300);
  };

  const handleConfirm = () => {
    setShowContent(false);
    setIsAnimating(false);
    setTimeout(() => {
      onConfirm();
      onClose();
    }, 300);
  };

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          iconBg: "from-red-500/20 to-orange-500/20",
          iconColor: "text-red-400",
          buttonBg:
            "bg-red-500/20 hover:bg-red-500/30 border-red-500/40 hover:border-red-500/50",
          buttonText: "text-red-300 hover:text-red-200",
          glowColor: "rgba(239, 68, 68, 0.15)",
        };
      case "warning":
      default:
        return {
          iconBg: "from-amber-500/20 to-yellow-500/20",
          iconColor: "text-amber-400",
          buttonBg:
            "bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 hover:border-amber-500/50",
          buttonText: "text-amber-300 hover:text-amber-200",
          glowColor: "rgba(251, 191, 36, 0.15)",
        };
    }
  };

  const styles = getVariantStyles();
  const IconComponent = icon || (variant === "danger" ? HiTrash : IoWarning);

  const dialogContent = (
    <>
      {/* Icon with animated glow */}
      <div className="relative mb-6">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${styles.iconBg} rounded-2xl blur-xl animate-pulse`}
          style={{ animationDuration: "3s" }}
        />
        <div
          className={`relative inline-flex p-4 rounded-2xl bg-gradient-to-br ${styles.iconBg} border border-white/10`}
        >
          <IconComponent className={`w-8 h-8 ${styles.iconColor}`} />
        </div>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>

      {/* Message */}
      <p className="text-gray-300 text-base leading-relaxed mb-6">{message}</p>

      {/* Details list if provided */}
      {details.length > 0 && (
        <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="space-y-2">
            {details.map((detail, index) => (
              <div key={index} className="flex items-start gap-2">
                <FiAlertCircle className="w-4 h-4 text-white/60 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-white/80">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={handleClose}
          className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-200 border border-white/20 hover:border-white/30"
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          className={`flex-1 px-6 py-3 ${styles.buttonBg} rounded-xl font-medium transition-all duration-200 border ${styles.buttonText}`}
        >
          {confirmText}
        </button>
      </div>
    </>
  );

  // Mobile bottom sheet style
  if (isMobile) {
    return createPortal(
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 z-[100] ${
            isAnimating
              ? "bg-black/70 backdrop-blur-sm"
              : "bg-transparent pointer-events-none"
          }`}
          onClick={handleClose}
        />

        {/* Bottom sheet */}
        <div
          className={`fixed bottom-0 left-0 right-0 z-[101] transition-all duration-300 ${
            isAnimating && showContent ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div
            className="bg-gradient-to-b from-[#2d2467] to-[#1a1848] rounded-t-3xl shadow-2xl border-t border-white/20 px-6 pt-6 pb-8"
            style={{
              boxShadow: `0 -10px 40px ${styles.glowColor}`,
            }}
          >
            {/* Drag handle */}
            <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-6" />
            {dialogContent}
          </div>
        </div>
      </>,
      document.body
    );
  }

  // Desktop centered modal
  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[100] ${
          isAnimating
            ? "bg-black/70 backdrop-blur-md"
            : "bg-transparent pointer-events-none"
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`relative max-w-md w-full pointer-events-auto transition-all duration-300 ${
            isAnimating && showContent
              ? "scale-100 opacity-100 translate-y-0"
              : "scale-95 opacity-0 translate-y-4"
          }`}
        >
          {/* Animated background gradient */}
          <div
            className="absolute -inset-4 bg-gradient-to-r from-[#14b8a6]/20 via-[#7c3aed]/20 to-[#ec4899]/20 rounded-3xl blur-2xl animate-pulse"
            style={{ animationDuration: "4s" }}
          />

          {/* Main content */}
          <div
            className="relative bg-gradient-to-br from-[#1e1b4b] to-[#0f172a] rounded-2xl shadow-2xl border border-white/20 overflow-hidden p-8"
            style={{
              boxShadow: `0 20px 60px ${styles.glowColor}`,
            }}
          >
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

            {/* Content */}
            <div className="relative text-center">{dialogContent}</div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default ConfirmDialog;
