import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { createPortal } from "react-dom";

const ToastContext = createContext({});

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};

const Toast = ({ id, message, type = "success", onRemove, duration }) => {
  const [isExiting, setIsExiting] = useState(false);
  const progressRef = useRef(null);

  useEffect(() => {
    // Start progress animation
    if (progressRef.current && duration > 0) {
      progressRef.current.style.transition = `width ${duration}ms linear`;
      progressRef.current.style.width = "0%";
    }
  }, [duration]);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(id), 300);
  };

  const bgColor =
    type === "success"
      ? "bg-[#14b8a6]"
      : type === "error"
      ? "bg-red-500"
      : type === "warning"
      ? "bg-yellow-500"
      : "bg-blue-500";

  const icon =
    type === "success" ? (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ) : type === "error" ? (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    ) : type === "warning" ? (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ) : (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    );

  return (
    <div
      className={`${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 mb-3 transition-all hover:scale-105 cursor-pointer relative overflow-hidden ${
        isExiting ? "animate-slideOutRight" : "animate-slideInRight"
      }`}
      onClick={handleRemove}
    >
      {icon}
      <span className="font-medium flex-1">{message}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleRemove();
        }}
        className="ml-2 hover:bg-white/20 rounded p-1 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
          <div
            ref={progressRef}
            className="h-full bg-white/50"
            style={{ width: "100%" }}
          />
        </div>
      )}
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timeoutRefs = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));

    // Clear timeout if exists
    if (timeoutRefs.current.has(id)) {
      clearTimeout(timeoutRefs.current.get(id));
      timeoutRefs.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message, type = "success", duration = null) => {
      const id = Date.now();

      // Default durations based on type
      if (duration === null) {
        duration = type === "error" ? 5000 : type === "warning" ? 4000 : 3000;
      }

      const newToast = { id, message, type, duration };

      setToasts((prev) => [...prev, newToast]);

      // Auto remove after duration (0 means no auto-remove)
      if (duration > 0) {
        const timeoutId = setTimeout(() => {
          removeToast(id);
        }, duration);

        // Store timeout ID for cleanup
        timeoutRefs.current.set(id, timeoutId);
      }

      return id;
    },
    [removeToast]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts
      timeoutRefs.current.forEach((timeoutId) => clearTimeout(timeoutId));
      timeoutRefs.current.clear();
    };
  }, []);

  const value = {
    showToast,
    removeToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="fixed bottom-32 right-6 z-[100] pointer-events-auto">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              id={toast.id}
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onRemove={removeToast}
            />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};
