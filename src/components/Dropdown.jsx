import { useState, useRef, useMemo } from "react";
import { IoChevronDown } from "react-icons/io5";
import { RiCloseLine } from "react-icons/ri";
import { Icon } from "@iconify/react";
import DropdownPortal from "./DropdownPortal";

const Dropdown = ({
  items = [],
  value,
  onChange,
  placeholder = "Select an option",
  renderIcon,
  renderLabel,
  width = 200,
  groups = null,
  className = "",
  buttonClassName = "",
  dropdownClassName = "",
  itemClassName = "",
  placement = "bottom-end",
  offset = 8,
  showCloseButton = false,
  closeButtonText = "Close",
  onDropdownClose,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);

  const selectedItem = items.find((item) =>
    typeof item === "string"
      ? item === value
      : item.value === value || item.code === value
  );

  // Get display label for selected item
  const getItemLabel = (item) => {
    if (renderLabel) return renderLabel(item);
    if (typeof item === "string") return item;
    return item.label || item.title || item.name || item.value;
  };

  const getItemValue = (item) => {
    if (typeof item === "string") return item;
    return item.value || item.code || item.id;
  };

  const handleSelect = (item) => {
    onChange(item);
    setIsOpen(false);
  };

  // Calculate selected index for auto-scroll
  const selectedIndex = useMemo(() => {
    const allItems = groups
      ? groups.flatMap((g) =>
          g.items
            .map((itemValue) =>
              items.find((item) => getItemValue(item) === itemValue)
            )
            .filter(Boolean)
        )
      : items;

    return allItems.findIndex((item) => {
      const itemValue = getItemValue(item);
      return itemValue === value;
    });
  }, [items, groups, value]);

  const prepareItems = () => {
    if (!groups) {
      return [{ items: items }];
    }

    // Convert groups format to rendered format
    return groups.map((group, index) => ({
      label: group.label,
      items: items.filter((item) => {
        const itemValue = getItemValue(item);
        return group.items.includes(itemValue);
      }),
      showDivider: index > 0,
    }));
  };

  const itemGroups = prepareItems();

  return (
    <>
      {/* Dropdown Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] 
          backdrop-blur-md rounded-full transition-all duration-200 border border-white/20 
          hover:border-white/30 group ${buttonClassName} ${className}`}
      >
        {/* Icon */}
        {renderIcon && selectedItem && (
          <div className="flex-shrink-0">{renderIcon(selectedItem)}</div>
        )}

        {/* Label */}
        <span className="text-white font-medium text-sm">
          {selectedItem ? getItemLabel(selectedItem) : placeholder}
        </span>

        {/* Chevron */}
        <IoChevronDown
          className={`text-white/60 transition-all duration-200 w-3 h-3 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <DropdownPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={buttonRef}
        minWidth={width}
        maxHeight={262}
        placement={placement}
        offset={offset}
        selectedIndex={selectedIndex}
        className={`bg-[#1a1848] border border-white/20 rounded-xl ${dropdownClassName}`}
      >
        <div className="py-2">
          {showCloseButton && (
            <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
              <span className="text-white/60 text-xs uppercase tracking-wider">
                {closeButtonText}
              </span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onDropdownClose?.();
                }}
                className="text-white/40 hover:text-white transition-colors"
              >
                <RiCloseLine className="w-4 h-4" />
              </button>
            </div>
          )}

          {itemGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Group Label */}
              {group.label && (
                <>
                  {group.showDivider && (
                    <div className="mx-4 my-1 border-t border-white/10" />
                  )}
                  <div className="px-4 pb-1 pt-1">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider font-medium">
                      {group.label}
                    </div>
                  </div>
                </>
              )}

              {/* Group Items */}
              <div className="py-1">
                {group.items.map((item, index) => {
                  const itemValue = getItemValue(item);
                  const isSelected = itemValue === value;

                  return (
                    <button
                      key={itemValue}
                      onClick={() => handleSelect(item)}
                      className={`w-full flex items-center gap-3 px-4 py-2 transition-all duration-200 ${
                        isSelected
                          ? "text-[#14b8a6] bg-[#14b8a6]/20"
                          : "text-white/80 hover:text-white hover:bg-white/10"
                      } ${itemClassName}`}
                    >
                      {/* Item Icon */}
                      {renderIcon && (
                        <div className="w-4 h-4 flex-shrink-0">
                          {renderIcon(item)}
                        </div>
                      )}

                      {/* Item Label */}
                      <span className="text-sm text-left flex-1">
                        {getItemLabel(item)}
                      </span>

                      {/* Selected Indicator */}
                      {isSelected && (
                        <div className="w-1.5 h-1.5 bg-[#14b8a6] rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DropdownPortal>
    </>
  );
};

export default Dropdown;
