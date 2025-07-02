import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useApp } from "../context/AppContext";
import { useScrollContainer } from "../context/ScrollContext";
import { HiOutlineMenu, HiOutlineCog } from "react-icons/hi";
import { RiCloseLine } from "react-icons/ri";
import { FiSearch } from "react-icons/fi";
import { IoChevronDown } from "react-icons/io5";
import { HiOutlineGlobeAlt } from "react-icons/hi";
import { Icon } from "@iconify/react";
import { logo } from "../assets";
import { links, genres } from "../assets/constants";
import PerformanceMonitor from "./PerformanceMonitor";
import DropdownPortal from "./DropdownPortal";
import Searchbar from "./Searchbar";
import {
  selectGenreListId,
  setSelectedCountry as setSelectedCountryAction,
} from "../redux/features/playerSlice";

const NavLinks = ({ handleClick }) => {
  const scrollContainerRef = useScrollContainer();
  const location = useLocation();
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

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
    <>
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
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
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

  const genreIcons = {
    POP: "mdi:star-four-points-outline",
    HIP_HOP_RAP: "mdi:microphone-variant",
    DANCE: "mdi:speaker-wireless",
    ELECTRONIC: "mdi:waveform",
    SOUL_RNB: "mdi:heart-multiple",
    ALTERNATIVE: "mdi:vinyl",
    ROCK: "mdi:guitar-electric",
    LATIN: "game-icons:maracas",
    FILM_TV: "mdi:movie-open-outline",
    COUNTRY: "mdi:hat-fedora",
    K_POP: "mdi:heart-settings-outline",
    INDIE: "mdi:cassette",
    METAL: "game-icons:anvil-impact",
    JAZZ: "game-icons:saxophone",
    CLASSICAL: "mdi:piano",
    LOFI: "mdi:coffee-outline",
  };

  const countries = [
    { code: "US", name: "United States" },
    { code: "GB", name: "United Kingdom" },
    { code: "CA", name: "Canada" },
    { code: "AU", name: "Australia" },
    { code: "DE", name: "Germany" },
    { code: "FR", name: "France" },
    { code: "JP", name: "Japan" },
    { code: "KR", name: "South Korea" },
    { code: "BR", name: "Brazil" },
    { code: "MX", name: "Mexico" },
    { code: "IN", name: "India" },
    { code: "IT", name: "Italy" },
    { code: "ES", name: "Spain" },
    { code: "NL", name: "Netherlands" },
    { code: "SE", name: "Sweden" },
  ];

  const selectedCountryName =
    countries.find((c) => c.code === (selectedCountry || "US"))?.name ||
    "United States";

  const handleSearch = (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      navigate(`/search/${e.target.value.trim()}`);
      e.target.value = "";
      setIsSearchExpanded(false);
    }
  };

  const handleGenreChange = (genre) => {
    dispatch(selectGenreListId(genre.value));
    setShowGenreDropdown(false);
  };

  const handleCountryChange = (country) => {
    dispatch(setSelectedCountryAction(country.code));
    setShowRegionDropdown(false);
  };

  const getControlsHeight = () => {
    if (showGenreDropdown || showRegionDropdown) {
      return "h-auto"; // Allow natural height when expanded
    }
    if (!currentTrack) return "h-24"; // Default height when no player
    return "h-24 desktop:h-28";
  };

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ease-out ${
        shouldShowControls
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`${getControlsHeight()} bg-gradient-to-t from-[#0f0e2e] via-[#1a1848]/80 to-transparent p-4 flex flex-col justify-center relative`}
      >
        {(showGenreDropdown || showRegionDropdown) && (
          <div className="absolute inset-0 bg-[#1a1848] z-10" />
        )}

        <div className="space-y-2 relative z-20">
          {/* Genre/Region Selector */}
          {showGenreSelector && (
            <div className="relative">
              {!showGenreDropdown ? (
                <button
                  onClick={() => setShowGenreDropdown(true)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 bg-white/[0.08] hover:bg-white/[0.12] 
                    backdrop-blur-md rounded-xl transition-all duration-200 border border-white/20 
                    hover:border-white/30 group"
                >
                  <Icon
                    icon={genreIcons[selectedGenre] || "mdi:music-note"}
                    className="w-4 h-4 text-[#14b8a6]"
                  />
                  <span className="text-white font-medium text-sm flex-1 text-left">
                    {genreTitle}
                  </span>
                  <IoChevronDown className="text-white/60 transition-all duration-200 w-3 h-3" />
                </button>
              ) : (
                <div className="bg-[#1a1848] rounded-xl border border-white/20 overflow-hidden relative z-20">
                  <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between bg-[#1a1848]">
                    <span className="text-white/60 text-xs uppercase tracking-wider">
                      Select Genre
                    </span>
                    <button
                      onClick={() => setShowGenreDropdown(false)}
                      className="text-white/40 hover:text-white transition-colors"
                    >
                      <RiCloseLine className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-[240px] overflow-y-auto custom-scrollbar bg-[#1a1848]">
                    {genres
                      .sort((a, b) => a.title.localeCompare(b.title))
                      .map((genre) => {
                        const isSelected = genre.value === selectedGenre;
                        return (
                          <button
                            key={genre.value}
                            onClick={() => handleGenreChange(genre)}
                            className={`w-full flex items-center gap-3 px-4 py-2 transition-all duration-200 ${
                              isSelected
                                ? "text-[#14b8a6] bg-[#14b8a6]/20"
                                : "text-white/80 hover:text-white hover:bg-white/10"
                            }`}
                          >
                            <Icon
                              icon={genreIcons[genre.value] || "mdi:music-note"}
                              className="w-4 h-4 flex-shrink-0"
                            />
                            <span className="text-sm text-left flex-1">
                              {genre.title}
                            </span>
                            {isSelected && (
                              <div className="w-1.5 h-1.5 bg-[#14b8a6] rounded-full" />
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Region Selector */}
          {showRegionSelector && (
            <div className="relative">
              {!showRegionDropdown ? (
                <button
                  onClick={() => setShowRegionDropdown(true)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 bg-white/[0.08] hover:bg-white/[0.12] 
                    backdrop-blur-md rounded-xl transition-all duration-200 border border-white/20 
                    hover:border-white/30 group"
                >
                  <HiOutlineGlobeAlt className="w-4 h-4 text-[#14b8a6]" />
                  <span className="text-white font-medium text-sm flex-1 text-left">
                    {selectedCountryName}
                  </span>
                  <IoChevronDown className="text-white/60 transition-all duration-200 w-3 h-3" />
                </button>
              ) : (
                <div className="bg-white/[0.08] backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
                  <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
                    <span className="text-white/60 text-xs uppercase tracking-wider">
                      Select Region
                    </span>
                    <button
                      onClick={() => setShowRegionDropdown(false)}
                      className="text-white/40 hover:text-white transition-colors"
                    >
                      <RiCloseLine className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {countries.map((country) => {
                      const isSelected = country.code === selectedCountry;
                      return (
                        <button
                          key={country.code}
                          onClick={() => handleCountryChange(country)}
                          className={`w-full flex items-center gap-3 px-4 py-2 transition-all duration-200 ${
                            isSelected
                              ? "text-[#14b8a6] bg-gradient-to-r from-[#14b8a6]/20 to-transparent"
                              : "text-white/80 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          <span className="text-sm text-left flex-1">
                            {country.name}
                          </span>
                          {isSelected && (
                            <div className="w-1.5 h-1.5 bg-[#14b8a6] rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            {isSearchExpanded ? (
              <input
                type="text"
                placeholder="Search songs..."
                onKeyDown={handleSearch}
                onBlur={() => setTimeout(() => setIsSearchExpanded(false), 200)}
                autoFocus
                className="w-full bg-white/[0.08] backdrop-blur-xl border border-white/20 rounded-xl 
                  placeholder-gray-400 outline-none text-sm text-white pl-10 pr-4 py-2.5
                  focus:bg-white/[0.12] focus:border-[#14b8a6]/50 focus:shadow-[0_0_20px_rgba(45,212,191,0.2)] 
                  transition-all duration-300"
              />
            ) : (
              <button
                onClick={() => setIsSearchExpanded(true)}
                className="w-full flex items-center gap-3 px-4 py-2.5 bg-white/[0.08] hover:bg-white/[0.12] 
                  backdrop-blur-md rounded-xl transition-all duration-200 border border-white/20 
                  hover:border-white/30 group"
              >
                <FiSearch className="w-4 h-4 text-gray-400 group-hover:text-[#14b8a6] transition-colors" />
                <span className="text-white/80 group-hover:text-white text-sm">
                  Quick Search
                </span>
              </button>
            )}
            {isSearchExpanded && (
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const LeftSidebar = () => {
  const { mobileMenuOpen, setMobileMenuOpen } = useApp();
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
      <div className="hidden sm:flex flex-col relative w-[240px] min-w-[240px] flex-shrink-0 h-full py-10 px-4 pb-32 bg-gradient-to-b from-[#1a1848]/95 to-[#0f0e2e]/95 backdrop-blur-md border-r border-white/5">
        <img
          src={logo}
          alt="logo"
          onClick={handleLogoClick}
          className="w-full h-14 object-contain cursor-pointer transition-transform hover:scale-105"
        />
        <NavLinks />
        <SidebarControls />
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
      </div>

      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm sm:hidden animate-fadeIn"
        />
      )}
    </>
  );
};

export default LeftSidebar;
