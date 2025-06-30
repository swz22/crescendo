import React from "react";
import { useSelector } from "react-redux";
import { selectCurrentContextTracks } from "../redux/features/playerSelectors";
import { HiOutlineQueueList } from "react-icons/hi2";

const QueueButton = ({ onClick }) => {
  const tracks = useSelector(selectCurrentContextTracks);
  const queueCount = tracks.length;

  return (
    <button
      onClick={onClick}
      className="relative p-2.5 sm:p-2 bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-xl transition-all duration-200 border border-white/10 hover:border-white/20 group"
      aria-label={`Queue (${queueCount} tracks)`}
    >
      <HiOutlineQueueList className="w-5 h-5 text-white" />
      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#14b8a6] rounded-full flex items-center justify-center">
        <span className="text-[10px] font-bold text-white">{queueCount}</span>
      </div>
    </button>
  );
};

export default QueueButton;
