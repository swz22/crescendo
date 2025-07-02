import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useScrollContainer } from "../context/ScrollContext";
import { HiOutlineMenu, HiOutlineCog } from "react-icons/hi";
import { RiCloseLine } from "react-icons/ri";
import { logo } from "../assets";
import { links } from "../assets/constants";
import PerformanceMonitor from "./PerformanceMonitor";

const NavLinks = ({ handleClick }) => {
  const scrollContainerRef = useScrollContainer();
  const location = useLocation();

  const handleNavClick = (e, path) => {
    if (location.pathname === path) {
      e.preventDefault();
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    } else {
      // Scroll to top after navigation
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      }, 50);
    }

    if (handleClick) {
      handleClick();
    }
  };

  return (
    <div className="mt-10">
      {links.map((item) => (
        <NavLink
          key={item.name}
          to={item.to}
          onClick={(e) => handleNavClick(e, item.to)}
          className={({ isActive }) =>
            `flex flex-row justify-start items-center my-4 sm:my-6 text-base font-medium 
            ${
              isActive
                ? "text-[#2dd4bf] bg-gradient-to-r from-[#2dd4bf]/20 to-transparent scale-105 shadow-xl shadow-[#2dd4bf]/20 border-l-4 border-[#2dd4bf]"
                : "text-gray-300 hover:text-white hover:bg-white/10 border-l-4 border-transparent"
            } 
            px-4 py-3 rounded-r-xl transition-all duration-300 group relative overflow-hidden`
          }
        >
          <item.icon
            className={`w-6 h-6 mr-3 transition-all duration-300 ${
              window.location.pathname === item.to
                ? "text-[#2dd4bf] drop-shadow-[0_0_8px_rgba(45,212,191,0.6)]"
                : "group-hover:scale-110 group-hover:text-white"
            }`}
          />
          <span className="font-semibold relative z-10">{item.name}</span>
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        </NavLink>
      ))}
    </div>
  );
};

const LeftSidebar = () => {
  const { mobileMenuOpen, setMobileMenuOpen } = useApp();
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);
  const scrollContainerRef = useScrollContainer();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoClick = (e) => {
    if (location.pathname === "/") {
      e.preventDefault();
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    } else {
      navigate("/");
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      }, 50);
    }
  };

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden sm:flex flex-col w-[240px] min-w-[240px] flex-shrink-0 h-full py-10 px-4 bg-gradient-to-b from-[#1a1848]/95 to-[#0f0e2e]/95 backdrop-blur-md border-r border-white/5">
        <img
          src={logo}
          alt="logo"
          onClick={handleLogoClick}
          className="w-full h-14 object-contain cursor-pointer transition-transform hover:scale-105"
        />
        <NavLinks />

        <div className="mt-auto mb-4">
          <button
            onClick={() => setShowPerformanceMonitor(true)}
            className="w-full flex items-center justify-start px-4 py-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 group"
            title="Performance Monitor"
          >
            <HiOutlineCog className="w-5 h-5 mr-3 group-hover:rotate-180 transition-transform duration-500" />
            <span className="text-sm font-medium">Performance</span>
          </button>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div
        className={`fixed top-0 h-full w-[280px] max-w-[85vw] bg-gradient-to-br from-[#1a1848]/98 to-[#0f0e2e]/98 backdrop-blur-lg z-50 p-6 sm:hidden transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center mb-10">
          <img
            src={logo}
            alt="logo"
            onClick={handleLogoClick}
            className="w-full h-14 object-contain max-w-[180px] cursor-pointer"
          />
          <HiOutlineMenu
            onClick={() => setMobileMenuOpen(false)}
            className="w-6 h-6 text-gray-300 cursor-pointer"
          />
        </div>
        <NavLinks handleClick={() => setMobileMenuOpen(false)} />

        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={() => {
              setShowPerformanceMonitor(true);
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-start px-4 py-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 group"
          >
            <HiOutlineCog className="w-5 h-5 mr-3 group-hover:rotate-180 transition-transform duration-500" />
            <span className="text-sm font-medium">Performance</span>
          </button>
        </div>
      </div>

      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm sm:hidden animate-fadeIn"
        />
      )}

      {showPerformanceMonitor && (
        <PerformanceMonitor onClose={() => setShowPerformanceMonitor(false)} />
      )}
    </>
  );
};

export default LeftSidebar;
