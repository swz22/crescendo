import { useState } from "react";
import Searchbar from "./Searchbar";
import QueueButton from "./QueueButton";
import MobileQueueSheet from "./MobileQueueSheet";

const PageHeader = ({ title, subtitle, children, selector }) => {
  const [mobileQueueOpen, setMobileQueueOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="sm:hidden pt-16 pb-4">
        {/* Row 1: Title + Selector */}
        <div className="flex items-center justify-between px-4 mb-2">
          <h2 className="font-bold text-xl text-white">{title}</h2>
          {selector}
        </div>

        {/* Row 2: Search + Queue */}
        <div className="px-4 flex items-center gap-2">
          <div className="flex-1">
            <input
              type="search"
              placeholder="Search songs..."
              className="w-full bg-white/[0.08] backdrop-blur-xl border border-white/20 rounded-full 
                         placeholder-gray-400 outline-none text-sm text-white pl-10 pr-4 py-2.5
                         focus:bg-white/[0.12] focus:border-[#2dd4bf]/50"
            />
          </div>
          <QueueButton onClick={() => setMobileQueueOpen(true)} />
        </div>
      </div>

      {/* Desktop Header - unchanged */}
      <div className="hidden sm:block w-full mb-6 mt-4 sm:mt-8">
        {/* Desktop content */}
      </div>

      <MobileQueueSheet
        isOpen={mobileQueueOpen}
        onClose={() => setMobileQueueOpen(false)}
      />
    </>
  );
};

export default PageHeader;
