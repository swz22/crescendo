import { useEffect } from "react";
import { createPortal } from "react-dom";

const Toast = ({ message, type = "success", duration = 2000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === "success" ? "bg-[#14b8a6]" : "bg-red-500";

  return createPortal(
    <div
      className={`fixed bottom-32 left-1/2 transform -translate-x-1/2 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slideup flex items-center gap-2`}
    >
      {type === "success" && (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      )}
      <span className="font-medium">{message}</span>
    </div>,
    document.body
  );
};

export default Toast;
