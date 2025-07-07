import { memo, useState } from "react";
import { HiOutlineMenu, HiX } from "react-icons/hi";
import { NavLink } from "react-router-dom";
import Searchbar from "./Searchbar";
import Portal from "./Portal";
import { links } from "../assets/constants";
import { logo } from "../assets";

const AppHeader = memo(({ title, subtitle, action, showSearch = false, className = "" }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />

            {/* Menu Panel */}
            <div className="absolute left-0 top-0 h-full w-64 bg-gradient-to-b from-[#1e1b4b] to-[#0f172a] shadow-2xl transform transition-transform duration-300">
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <img src={logo} alt="logo" className="w-32 h-8 object-contain" />
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <HiX className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Nav Links */}
              <div className="p-4">
                {links.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.to}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 mb-2 rounded-xl transition-all duration-200 ${
                        isActive
                          ? "bg-[#14b8a6] text-white shadow-lg shadow-[#14b8a6]/30"
                          : "text-gray-300 hover:bg-white/10 hover:text-white"
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        </Portal>
      )}

      <div
        className={`
            relative mb-1 sm:mb-6 md:mb-8 
            ${
              showSearch
                ? "bg-gradient-to-b from-white/[0.02] to-transparent backdrop-blur-sm"
                : "bg-gradient-to-b from-white/[0.02] to-transparent backdrop-blur-sm"
            }
            ${className}
          `}
      >
        {/* Mobile Layout - Extended to 768px */}
        <div className="md:hidden">
          {/* Row 1: Compact Header */}
          <div className="flex items-center px-4 pt-4 pb-2">
            {/* Menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 -ml-1.5 rounded-lg hover:bg-white/10 transition-colors active:scale-95"
              aria-label="Open menu"
            >
              <HiOutlineMenu className="w-5 h-5 text-white" />
            </button>

            {/* Title container */}
            <div className="flex-1 flex items-center justify-center">
              <h1 className="text-lg font-bold text-white truncate text-center">{title}</h1>
            </div>

            <div className="w-[44px] flex items-center justify-end">
              {action && <div className="flex-shrink-0">{action}</div>}
            </div>
          </div>

          {/* Row 2: Search Bar */}
          {showSearch && (
            <div className="px-4 pb-3">
              <Searchbar />
            </div>
          )}
        </div>

        {/* Tablet Layout - Stacked Design for 768px to 1024px */}
        <div className="hidden md:block lg:hidden">
          <div className="px-6 py-4">
            {/* Title Row - Centered */}
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold text-white">{title}</h1>
            </div>

            {/* Search and Action Row */}
            <div className="flex items-center justify-center gap-4">
              {showSearch && (
                <div className="flex-1 max-w-md">
                  <Searchbar />
                </div>
              )}
              {action && <div className="flex-shrink-0">{action}</div>}
            </div>
          </div>
        </div>

        {/* Desktop Layout (1024px+) */}
        <div className="hidden lg:block">
          <div className="pl-3 pr-6 py-4">
            <div className="flex items-center justify-between gap-6">
              {/* Left Section - Title and Subtitle */}
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl lg:text-3xl font-bold text-white truncate">{title}</h1>
                {subtitle && <p className="text-sm text-gray-400 mt-1 truncate">{subtitle}</p>}
              </div>

              {/* Right Section - Actions and Search */}
              <div className="flex items-center gap-6 flex-shrink-0">
                {action && <div className="flex items-center gap-2">{action}</div>}
                {showSearch && (
                  <div className="w-64 lg:w-80">
                    <Searchbar />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

AppHeader.displayName = "AppHeader";

export default AppHeader;
