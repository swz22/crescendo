import { useState } from 'react';

const Tooltip = ({ text, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block w-full">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
      </div>
      
      {showTooltip && text && (
        <div className="absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-xl 
                        bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                        whitespace-normal max-w-xs pointer-events-none
                        animate-fadeIn">
          <div className="relative">
            {text}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 
                            border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;