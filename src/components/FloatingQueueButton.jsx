import React from "react";
import { useSelector } from "react-redux";
import { HiOutlineViewList } from "react-icons/hi";

const FloatingQueueButton = ({ onClick }) => {
  const { queue, isPlaying } = useSelector((state) => state.player);

  if (queue.length === 0) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-32 right-4 w-14 h-14 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 lg:hidden hover:scale-110 active:scale-95"
    >
      <HiOutlineViewList className="w-6 h-6" />
      {queue.length > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {queue.length}
        </span>
      )}
      {isPlaying && (
        <span className="absolute -bottom-1 -left-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
      )}
    </button>
  );
};

export default FloatingQueueButton;
