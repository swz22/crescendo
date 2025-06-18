import { useEffect, useRef, useState } from "react";
import Portal from "./Portal";

const DropdownPortal = ({
  isOpen,
  onClose,
  triggerRef,
  children,
  className = "",
  placement = "bottom-end",
  offset = 8,
  maxHeight = 400,
  minWidth = 240,
  selectedIndex = -1, // Index of selected item for auto-scroll
}) => {
  const dropdownRef = useRef(null);
  const contentRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [actualPlacement, setActualPlacement] = useState(placement);

  // Auto-scroll to selected item when dropdown opens
  useEffect(() => {
    if (!isOpen || selectedIndex < 0) return;

    // Use requestAnimationFrame to wait for next paint
    const checkAndScroll = () => {
      if (contentRef.current) {
        const content = contentRef.current;
        const items = content.querySelectorAll("button");

        if (items[selectedIndex]) {
          const selectedItem = items[selectedIndex];
          const itemTop = selectedItem.offsetTop;
          const itemHeight = selectedItem.offsetHeight;
          const contentHeight = content.clientHeight;

          // Calculate scroll position to center the item
          const desiredScrollTop = itemTop - contentHeight / 2 + itemHeight / 2;

          content.scrollTo({
            top: Math.max(0, desiredScrollTop),
            behavior: "smooth",
          });
        }
      } else {
        // If content not ready, try again on next frame
        requestAnimationFrame(checkAndScroll);
      }
    };

    requestAnimationFrame(checkAndScroll);
  }, [isOpen, selectedIndex]);

  // Calculate position
  useEffect(() => {
    if (!isOpen || !triggerRef?.current) return;

    const calculatePosition = () => {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Initial position based on placement
      let top = 0;
      let left = 0;
      let currentPlacement = placement;

      // Calculate initial position
      if (placement.startsWith("bottom")) {
        top = triggerRect.bottom + offset;
      } else {
        top = triggerRect.top - offset;
      }

      if (placement.endsWith("start")) {
        left = triggerRect.left;
      } else {
        left = triggerRect.right;
      }

      // Get dropdown dimensions (estimate)
      const dropdownWidth = Math.max(minWidth, triggerRect.width);
      const dropdownHeight = Math.min(maxHeight, viewportHeight * 0.8);

      // Adjust for viewport boundaries
      // Horizontal adjustment
      if (placement.endsWith("end")) {
        // Right-aligned
        left = triggerRect.right - dropdownWidth;
        if (left < 10) {
          // Too far left, switch to left-aligned
          left = triggerRect.left;
          currentPlacement = placement.replace("end", "start");
        }
      } else {
        // Left-aligned
        if (left + dropdownWidth > viewportWidth - 10) {
          // Too far right, switch to right-aligned
          left = triggerRect.right - dropdownWidth;
          currentPlacement = placement.replace("start", "end");
        }
      }

      // Vertical adjustment
      if (placement.startsWith("bottom")) {
        if (top + dropdownHeight > viewportHeight - 10) {
          // Not enough space below, flip to top
          top = triggerRect.top - dropdownHeight - offset;
          currentPlacement = currentPlacement.replace("bottom", "top");
        }
      } else {
        if (top < 10) {
          // Not enough space above, flip to bottom
          top = triggerRect.bottom + offset;
          currentPlacement = currentPlacement.replace("top", "bottom");
        }
      }

      // Ensure dropdown stays within viewport
      left = Math.max(10, Math.min(left, viewportWidth - dropdownWidth - 10));
      top = Math.max(10, Math.min(top, viewportHeight - dropdownHeight - 10));

      setPosition({ top, left });
      setActualPlacement(currentPlacement);
    };

    calculatePosition();

    // Recalculate on scroll/resize
    const handleRecalculate = () => calculatePosition();
    window.addEventListener("resize", handleRecalculate);
    window.addEventListener("scroll", handleRecalculate, true);

    return () => {
      window.removeEventListener("resize", handleRecalculate);
      window.removeEventListener("scroll", handleRecalculate, true);
    };
  }, [isOpen, triggerRef, placement, offset, maxHeight, minWidth]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    // Close on escape key
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    // Small delay to prevent immediate closing
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        ref={dropdownRef}
        className={`
          fixed z-[100] 
          bg-[#1e1b4b]/98 backdrop-blur-xl 
          rounded-xl shadow-2xl 
          border border-white/10 
          animate-fadeIn
          overflow-hidden
          ${className}
        `}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          minWidth: `${minWidth}px`,
          maxHeight: `${maxHeight}px`,
        }}
      >
        <div
          ref={contentRef}
          className="overflow-y-auto custom-scrollbar"
          style={{ maxHeight: `${maxHeight}px` }}
        >
          {children}
        </div>
      </div>
    </Portal>
  );
};

export default DropdownPortal;
