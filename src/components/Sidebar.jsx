import { NavLink } from "react-router-dom";
import {
  HiOutlineHashtag,
  HiOutlineHome,
  HiOutlineMenu,
  HiOutlinePhotograph,
  HiOutlineUserGroup,
} from "react-icons/hi";

const links = [
  { name: "Discover", to: "/", icon: HiOutlineHome },
  { name: "Around You", to: "/around-you", icon: HiOutlinePhotograph },
  { name: "Top Artists", to: "/top-artists", icon: HiOutlineUserGroup },
  { name: "Top Charts", to: "/top-charts", icon: HiOutlineHashtag },
];

const Sidebar = () => (
  <div className="h-screen flex flex-col min-w-[240px] py-10 px-4 bg-[#191624]">
    <div className="mt-4 flex flex-col">
      {links.map((item) => (
        <NavLink
          key={item.name}
          to={item.to}
          className={`flex flex-row justify-start items-center my-4 text-sm font-medium ${
            item.current ? "text-cyan-500" : "text-gray-400 hover:text-cyan-400"
          }`}
        >
          <item.icon className="w-6 h-6 mr-2" />
          {item.name}
        </NavLink>
      ))}
    </div>
  </div>
);

export default Sidebar;
