import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  HiOutlineHome,
  HiOutlineMenu,
  HiOutlineUserGroup,
  HiOutlineSparkles,
  HiOutlineCollection,
} from "react-icons/hi";
import { RiCloseLine } from "react-icons/ri";
import { logo } from "../assets";

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
          `flex flex-row justify-start items-center my-8 text-base font-medium 
          ${
            isActive
              ? "text-[#2dd4bf] bg-white/10 scale-105 shadow-lg shadow-teal-500/20"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          } 
          px-4 py-3 rounded-lg transition-all duration-200 group`
        }
        onClick={() => handleClick && handleClick()}
      >
        <item.icon className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
        <span className="font-semibold">{item.name}</span>
      </NavLink>
    ))}
  </div>
);

const LeftSidebar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <div className="md:flex hidden flex-col w-[240px] h-full py-10 px-4 bg-gradient-to-b from-[#1a1848]/95 to-[#0f0e2e]/95 backdrop-blur-md border-r border-white/5">
        <img
          src={logo}
          alt="logo"
          onClick={() => (window.location.href = "/")}
          className="w-full h-14 object-contain cursor-pointer transition-transform hover:scale-105"
        />
        <NavLinks />
      </div>

      {/* Mobile sidebar */}
      <div className="absolute md:hidden block top-6 right-3 z-50">
        {!mobileMenuOpen ? (
          <HiOutlineMenu
            className="w-6 h-6 mr-2 text-white"
            onClick={() => setMobileMenuOpen(true)}
          />
        ) : (
          <RiCloseLine
            className="w-6 h-6 mr-2 text-white"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </div>

      <div
        className={`absolute top-0 h-screen w-2/3 bg-gradient-to-br from-[#1a1848]/95 to-[#0f0e2e]/95 backdrop-blur-lg z-50 p-6 md:hidden smooth-transition ${
          mobileMenuOpen ? "left-0" : "-left-full"
        }`}
      >
        <img
          src={logo}
          alt="logo"
          className="w-full h-14 object-contain mt-8"
        />
        <NavLinks handleClick={() => setMobileMenuOpen(false)} />
      </div>
    </>
  );
};

export default LeftSidebar;
