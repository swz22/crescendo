import { useNavigate } from "react-router-dom";

const Error = ({ message, canRetry, onRetry }) => {
  const navigate = useNavigate();

  return (
    <div className="w-full flex justify-center items-center min-h-[400px]">
      <div className="text-center p-8 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 max-w-md">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="font-bold text-2xl text-white mb-2">
          {message || "Something went wrong"}
        </h1>

        <p className="text-gray-400 mb-6">
          We're having trouble loading this content. Please try again.
        </p>

        <div className="flex gap-3 justify-center">
          {canRetry && onRetry ? (
            <button
              onClick={onRetry}
              className="px-6 py-2.5 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-all"
            >
              Try Again
            </button>
          ) : (
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2.5 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-all"
            >
              Go Home
            </button>
          )}

          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default Error;
