import { useState } from "react";
import Searchbar from "./Searchbar";
import QueueButton from "./QueueButton";
import MobileQueueSheet from "./MobileQueueSheet";

const PageHeader = ({ title, subtitle, children, selector }) => {
  const [mobileQueueOpen, setMobileQueueOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="sm:hidden mb-6 mt-8">
        <div className="flex items-center justify-between mb-3 px-4">
          <h2 className="font-bold text-2xl text-white truncate flex-1 mr-2 pl-12">
            {title}
          </h2>
          {selector && <div className="flex-shrink-0">{selector}</div>}
        </div>
        <div className="px-4 flex gap-2">
          <div className="flex-1">
            <Searchbar />
          </div>
          <QueueButton onClick={() => setMobileQueueOpen(true)} />
        </div>
        {children && <div className="px-4 mt-3">{children}</div>}
      </div>

      {/* Desktop Header - unchanged */}
      <div className="hidden sm:block w-full mb-6 mt-4 sm:mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-8 mb-4">
          <div className="min-w-0">
            <h2 className="font-bold text-2xl sm:text-3xl text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="text-gray-400 text-base sm:text-lg mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex-1 max-w-full sm:max-w-2xl">
            <Searchbar />
          </div>
        </div>
        {children}
      </div>

      {/* Mobile Queue Sheet */}
      <MobileQueueSheet
        isOpen={mobileQueueOpen}
        onClose={() => setMobileQueueOpen(false)}
      />
    </>
  );
};

export default PageHeader;
