import { NavLink } from "react-router-dom";
import {
  HiOutlineHome,
  HiOutlineSearch,
  HiOutlineCollection,
  HiOutlineUser,
} from "react-icons/hi";

const BottomNavigation = () => {
  const navItems = [
    { name: "Home", path: "/", icon: HiOutlineHome },
    { name: "Search", path: "/search/", icon: HiOutlineSearch },
    { name: "Library", path: "/playlists", icon: HiOutlineCollection },
    { name: "Profile", path: "/profile", icon: HiOutlineUser },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-white/10 z-40 sm:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-2 px-1 transition-all duration-200 ${
                isActive ? "text-[#14b8a6]" : "text-gray-400"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={`w-6 h-6 ${isActive ? "scale-110" : ""}`}
                />
                <span className="text-[10px] mt-1">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
