import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  HiOutlineHome,
  HiOutlineMenu,
  HiOutlineUserGroup,
  HiOutlineSparkles,
  HiOutlineCollection,
  HiOutlineCog,
} from "react-icons/hi";
import { RiCloseLine } from "react-icons/ri";
import { logo } from "../assets";
import PerformanceMonitor from "./PerformanceMonitor";

const links = [
  { name: "Discover", to: "/", icon: HiOutlineHome },
  { name: "Top Artists", to: "/top-artists", icon: HiOutlineUserGroup },
  { name: "New Releases", to: "/new-releases", icon: HiOutlineSparkles },
  { name: "Community Playlists", to: "/playlists", icon: HiOutlineCollection },
];

const NavLinks = ({ handleClick }) => (
  <div className="mt-10">
    {links.map((item) => (
      <NavLink
        key={item.name}
        to={item.to}
        className={({ isActive }) =>
          `flex flex-row justify-start items-center my-4 sm:my-8 text-base font-medium 
          ${
            isActive
              ? "text-[#2dd4bf] bg-gradient-to-r from-[#2dd4bf]/20 to-transparent scale-105 shadow-xl shadow-[#2dd4bf]/20 border-l-4 border-[#2dd4bf]"
              : "text-gray-300 hover:text-white hover:bg-white/10 border-l-4 border-transparent"
          } 
          px-4 py-3 rounded-r-xl transition-all duration-300 group relative overflow-hidden`
        }
        onClick={() => handleClick && handleClick()}
      >
        <item.icon
          className={`w-6 h-6 mr-3 transition-all duration-300 ${
            window.location.pathname === item.to
              ? "text-[#2dd4bf] drop-shadow-[0_0_8px_rgba(45,212,191,0.6)]"
              : "group-hover:scale-110 group-hover:text-white"
          }`}
        />
        <span className="font-semibold relative z-10">{item.name}</span>
        {/* Hover effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      </NavLink>
    ))}
  </div>
);

const LeftSidebar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

  return (
    <>
      <div className="hidden sm:flex flex-col w-[60px] sm:w-[240px] h-full py-10 px-2 sm:px-4 bg-gradient-to-b from-[#1a1848]/95 to-[#0f0e2e]/95 backdrop-blur-md border-r border-white/5 transition-all duration-300">
        <img
          src={logo}
          alt="logo"
          onClick={() => (window.location.href = "/")}
          className="w-full h-14 object-contain cursor-pointer transition-transform hover:scale-105 hidden sm:block"
        />
        {/* Mobile icon version */}
        <div className="sm:hidden flex justify-center mb-6">
          <div className="w-10 h-10 bg-[#14b8a6] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">C</span>
          </div>
        </div>
        <NavLinks />

        {/* Performance Monitor Button - positioned at bottom */}
        <div className="mt-auto mb-4">
          <button
            onClick={() => setShowPerformanceMonitor(true)}
            className="w-full flex items-center justify-start px-2 sm:px-4 py-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 group"
            title="Performance Monitor"
          >
            <HiOutlineCog className="w-5 h-5 sm:mr-3 group-hover:rotate-180 transition-transform duration-500" />
            <span className="text-sm font-medium hidden sm:inline">
              Performance
            </span>
          </button>
        </div>
      </div>

      {/* Mobile sidebar trigger */}
      <div className="fixed sm:hidden top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2.5 bg-[#1e1b4b]/90 backdrop-blur-md rounded-xl border border-white/20 shadow-lg"
        >
          {!mobileMenuOpen ? (
            <HiOutlineMenu className="w-6 h-6 text-white" />
          ) : (
            <RiCloseLine className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 sm:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed top-0 h-full w-[280px] max-w-[85vw] bg-gradient-to-br from-[#1a1848]/98 to-[#0f0e2e]/98 backdrop-blur-lg z-50 p-6 sm:hidden transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <img src={logo} alt="logo" className="w-full h-14 object-contain" />
        <NavLinks handleClick={() => setMobileMenuOpen(false)} />

        {/* Performance Monitor Button for mobile */}
        <div className="mt-auto mb-6">
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

      {/* Performance Monitor Component - Now controlled by sidebar */}
      {showPerformanceMonitor && (
        <PerformanceMonitor onClose={() => setShowPerformanceMonitor(false)} />
      )}
    </>
  );
};

export default LeftSidebar;
