import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { HiPlus } from "react-icons/hi";

const QueueIndicator = () => {
  const [showIndicator, setShowIndicator] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Listen for queue events
    const handleQueueUpdate = (event) => {
      const { detail } = event;
      if (detail && detail.message) {
        setMessage(detail.message);
        setShowIndicator(true);

        const timer = setTimeout(() => {
          setShowIndicator(false);
        }, 2000);

        return () => clearTimeout(timer);
      }
    };

    window.addEventListener("queueUpdate", handleQueueUpdate);
    return () => window.removeEventListener("queueUpdate", handleQueueUpdate);
  }, []);

  if (!showIndicator) return null;

  return (
    <div className="fixed bottom-32 right-[420px] bg-[#14b8a6] text-white px-4 py-2 rounded-lg shadow-lg animate-slideInLeft flex items-center gap-2 z-40">
      <HiPlus className="w-5 h-5" />
      <span className="font-medium">{message}</span>
    </div>
  );
};

export default QueueIndicator;
