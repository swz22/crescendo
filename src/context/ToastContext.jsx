import React, { createContext, useContext, useState, useCallback } from "react";
import { createPortal } from "react-dom";

const ToastContext = createContext({});

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};

const Toast = ({ id, message, type = "success", onRemove }) => {
  const bgColor =
    type === "success"
      ? "bg-[#14b8a6]"
      : type === "error"
      ? "bg-red-500"
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
      className={`${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 mb-3 animate-slideInRight transition-all hover:scale-105 cursor-pointer`}
      onClick={() => onRemove(id)}
    >
      {icon}
      <span className="font-medium">{message}</span>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(
    (message, type = "success", duration = 3000) => {
      const id = Date.now();
      const newToast = { id, message, type };

      setToasts((prev) => [...prev, newToast]);

      // Auto remove after duration
      setTimeout(() => {
        removeToast(id);
      }, duration);

      return id;
    },
    []
  );

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
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
              onRemove={removeToast}
            />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};
