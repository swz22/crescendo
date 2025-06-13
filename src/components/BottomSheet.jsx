import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const BottomSheet = ({ isOpen, onClose, children, title }) => {
  const sheetRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleTouchStart = (e) => {
    isDragging.current = true;
    startY.current = e.touches[0].clientY;
    currentY.current = 0;
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;

    const deltaY = e.touches[0].clientY - startY.current;
    currentY.current = Math.max(0, deltaY);

    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${currentY.current}px)`;
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;

    if (currentY.current > 100) {
      onClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = "translateY(0)";
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-fadeIn"
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 bg-[#1e1b4b] rounded-t-3xl shadow-2xl z-[101] animate-slideUp transition-transform"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mt-3 mb-2" />
        {title && (
          <h3 className="text-white font-semibold text-lg px-6 pb-2">
            {title}
          </h3>
        )}
        <div className="max-h-[70vh] overflow-y-auto pb-safe">{children}</div>
      </div>
    </>,
    document.body
  );
};

export default BottomSheet;
