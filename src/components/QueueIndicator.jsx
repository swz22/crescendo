import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { HiPlus } from "react-icons/hi";

const QueueIndicator = () => {
  const { currentSongs } = useSelector((state) => state.player);
  const [showIndicator, setShowIndicator] = useState(false);
  const [addedCount, setAddedCount] = useState(0);
  const [prevLength, setPrevLength] = useState(currentSongs.length);

  useEffect(() => {
    if (currentSongs.length > prevLength) {
      const diff = currentSongs.length - prevLength;
      setAddedCount(diff);
      setShowIndicator(true);

      const timer = setTimeout(() => {
        setShowIndicator(false);
      }, 2000);

      setPrevLength(currentSongs.length);
      return () => clearTimeout(timer);
    }
    setPrevLength(currentSongs.length);
  }, [currentSongs.length, prevLength]);

  if (!showIndicator) return null;

  return (
    <div className="fixed bottom-40 right-[400px] bg-[#14b8a6] text-white px-4 py-2 rounded-lg shadow-lg animate-slideInLeft flex items-center gap-2 z-50">
      <HiPlus className="w-5 h-5" />
      <span className="font-medium">
        {addedCount} track{addedCount > 1 ? "s" : ""} added to queue
      </span>
    </div>
  );
};

export default QueueIndicator;
