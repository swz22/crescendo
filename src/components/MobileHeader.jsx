import { useState } from "react";
import Searchbar from "./Searchbar";
import QueueButton from "./QueueButton";
import MobileQueueSheet from "./MobileQueueSheet";

const MobileHeader = ({ title, selector }) => {
  const [mobileQueueOpen, setMobileQueueOpen] = useState(false);

  return (
    <>
      <div className="sm:hidden mt-14">
        {" "}
        {/* Space for fixed menu button */}
        {/* Row 1: Title and Selector */}
        <div className="flex items-center justify-between mb-2 px-4">
          <h2 className="font-bold text-xl text-white truncate flex-1 mr-2">
            {title}
          </h2>
          {selector && <div className="flex-shrink-0">{selector}</div>}
        </div>
        {/* Row 2: Search bar and queue button */}
        <div className="px-4 flex gap-2 mb-4">
          <div className="flex-1">
            <Searchbar />
          </div>
          <QueueButton onClick={() => setMobileQueueOpen(true)} />
        </div>
      </div>

      {/* Mobile Queue Sheet */}
      <MobileQueueSheet
        isOpen={mobileQueueOpen}
        onClose={() => setMobileQueueOpen(false)}
      />
    </>
  );
};

export default MobileHeader;
