import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { HiOutlineHome, HiOutlineCog } from "react-icons/hi";
import { HiOutlineGlobeAlt } from "react-icons/hi";
import { RiCloseLine } from "react-icons/ri";
import { FiSearch } from "react-icons/fi";
import { MdHomeFilled } from "react-icons/md";
import { IoChevronDown, IoCloseCircle } from "react-icons/io5";
import { Icon } from "@iconify/react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectGenreListId,
  setSelectedCountry as setSelectedCountryAction,
} from "../redux/features/playerSlice";
import { links, genres, countries, genreIcons } from "../assets/constants";
import { logo } from "../assets";
import { useScrollContainer } from "../context/ScrollContext";
import { useApp } from "../context/AppContext";
import PerformanceMonitor from "./PerformanceMonitor";
import Dropdown from "./Dropdown";

const NavLinks = () => {
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

  return (
    <>
      <div className="mt-8 sm:mt-10">
        {links.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
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

        {/* Performance link */}
        <button
          onClick={() => setShowPerformanceMonitor(true)}
          className="flex flex-row justify-start items-center my-4 sm:my-6 text-base font-medium 
            text-gray-300 hover:text-white hover:bg-white/10 border-l-4 border-transparent
            px-4 py-3 rounded-r-xl transition-all duration-300 group relative overflow-hidden w-full"
        >
          <HiOutlineCog className="w-6 h-6 mr-3 transition-all duration-300 group-hover:scale-110 group-hover:rotate-180 group-hover:text-white" />
          <span className="font-semibold relative z-10">Performance</span>
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        </button>
      </div>

      {showPerformanceMonitor && (
        <PerformanceMonitor onClose={() => setShowPerformanceMonitor(false)} />
      )}
    </>
  );
};

const SidebarControls = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { genreListId, currentTrack, selectedCountry } = useSelector(
    (state) => state.player
  );

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Detect scroll to show/hide controls
  useEffect(() => {
    const scrollContainer = document.querySelector(".custom-scrollbar");
    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrollY = scrollContainer.scrollTop;
      const threshold = 100;
      setIsVisible(scrollY > threshold);
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  const isDiscoverPage = location.pathname === "/";
  const isTopArtistsPage = location.pathname === "/top-artists";
  const isTopAlbumsPage = location.pathname === "/top-albums";
  const isNewReleasesPage = location.pathname === "/new-releases";
  const isCommunityPlaylistsPage = location.pathname === "/playlists";

  const showGenreSelector = isDiscoverPage;
  const showRegionSelector = isTopArtistsPage || isTopAlbumsPage;

  const shouldShowControls =
    isVisible &&
    (showGenreSelector ||
      showRegionSelector ||
      isNewReleasesPage ||
      isCommunityPlaylistsPage);

  const selectedGenre = genreListId || "POP";
  const genreTitle =
    genres.find(({ value }) => value === selectedGenre)?.title || "Pop";

  const selectedCountryName =
    countries.find((c) => c.code === (selectedCountry || "US"))?.name ||
    "United States";

  const selectedCountryFlag =
    countries.find((c) => c.code === (selectedCountry || "US"))?.flag || "us";

  const handleSearch = (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      navigate(`/search/${e.target.value.trim()}`);
      e.target.value = "";
      setIsSearchExpanded(false);
    }
  };

  const handleGenreChange = (genre) => {
    dispatch(selectGenreListId(genre.value));
  };

  const handleCountryChange = (country) => {
    dispatch(setSelectedCountryAction(country.code));
  };

  const sortedGenres = [...genres].sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  return (
    <div
      className={`absolute -bottom-1 left-0 right-0 transition-transform duration-500 ease-out ${
        shouldShowControls
          ? "translate-y-0"
          : "translate-y-full pointer-events-none"
      }`}
    >
      <div className="p-4 flex flex-col justify-center">
        <div className="space-y-2">
          {/* Genre Selector */}
          {showGenreSelector && (
            <Dropdown
              items={sortedGenres}
              value={selectedGenre}
              onChange={handleGenreChange}
              placeholder="Select Genre"
              renderIcon={(genre) => (
                <Icon
                  icon={genreIcons[genre.value] || "mdi:music-note"}
                  className="w-4 h-4 text-[#14b8a6]"
                />
              )}
              renderLabel={(genre) => genre.title}
              width={200}
              placement="bottom-start"
              offset={-312}
              showCloseButton={true}
              closeButtonText="Select Genre"
              dropdownClassName="translate-x-1"
              buttonClassName="w-full flex items-center gap-3 px-4 py-2.5 bg-white/[0.08] hover:bg-white/[0.12] backdrop-blur-md rounded-xl transition-all duration-200 border border-white/20 hover:border-white/30 group pointer-events-auto"
            />
          )}

          {/* Region Selector */}
          {showRegionSelector && (
            <Dropdown
              items={countries}
              value={selectedCountry || "US"}
              onChange={handleCountryChange}
              placeholder="Select Region"
              renderIcon={(country) => (
                <Icon
                  icon={`circle-flags:${country.flag}`}
                  className="w-4 h-4"
                />
              )}
              renderLabel={(country) => country.name}
              width={200}
              placement="bottom-start"
              offset={-312}
              showCloseButton={true}
              closeButtonText="Select Region"
              dropdownClassName="translate-x-1"
              buttonClassName="w-full flex items-center gap-3 px-4 py-2.5 bg-white/[0.08] hover:bg-white/[0.12] backdrop-blur-md rounded-xl transition-all duration-200 border border-white/20 hover:border-white/30 group pointer-events-auto"
            />
          )}

          {/* Search */}
          <div className="relative">
            {isSearchExpanded ? (
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search songs..."
                  className="w-full pl-10 pr-10 py-2.5 bg-white/[0.08] hover:bg-white/[0.12] backdrop-blur-md 
                    rounded-xl transition-all duration-200 border border-white/20 hover:border-white/30 
                    text-white placeholder-gray-400 text-sm focus:outline-none focus:border-[#14b8a6]/50 
                    focus:bg-white/[0.12] pointer-events-auto"
                  onKeyDown={handleSearch}
                  autoFocus
                />
                <button
                  onClick={() => setIsSearchExpanded(false)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors pointer-events-auto"
                >
                  <IoCloseCircle className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSearchExpanded(true)}
                className="w-full flex items-center gap-3 px-4 py-2.5 bg-white/[0.08] hover:bg-white/[0.12] 
                  backdrop-blur-md rounded-xl transition-all duration-200 border border-white/20 
                  hover:border-white/30 group pointer-events-auto"
              >
                <FiSearch className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                <span className="text-white/60 group-hover:text-white font-medium text-sm flex-1 text-left transition-colors">
                  Quick Search
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MobileSidebar = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const { currentTrack } = useSelector((state) => state.player);

  return (
    <>
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`absolute top-0 z-50 p-6 h-screen w-[70%] max-w-sm bg-gradient-to-b from-[#1e1b4b] to-[#0f172a] md:hidden smooth-transition ${
          mobileMenuOpen ? "left-0" : "-left-full"
        } ${currentTrack?.title ? "pb-32" : "pb-6"}`}
      >
        <div className="flex items-center justify-between mb-10">
          <img
            src={logo}
            alt="logo"
            className="w-full h-10 object-contain"
            onClick={() => setMobileMenuOpen(false)}
          />
          <HiOutlineGlobeAlt
            className="w-6 h-6 cursor-pointer text-white"
            onClick={() => setMobileMenuOpen(false)}
          />
        </div>
        <NavLinks />
      </div>
    </>
  );
};

const LeftSidebar = () => {
  const { mobileMenuOpen, setMobileMenuOpen } = useApp();

  return (
    <>
      <MobileSidebar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Desktop Sidebar */}
      <div className="md:flex hidden flex-col w-[240px] py-8 px-4 bg-gradient-to-b from-[#1e1b4b] to-[#0f172a] h-screen overflow-hidden relative">
        <div className="flex items-center justify-center mb-2">
          <img
            src={logo}
            alt="logo"
            className="w-full h-10 object-contain cursor-pointer"
            onClick={() => (window.location.href = "/")}
          />
        </div>
        <NavLinks />
        <SidebarControls />
      </div>
    </>
  );
};

export default LeftSidebar;
