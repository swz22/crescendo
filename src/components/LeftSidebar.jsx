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
import { links, genres } from "../assets/constants";
import { logo } from "../assets";
import { useScrollContainer } from "../context/ScrollContext";
import { useApp } from "../context/AppContext";
import PerformanceMonitor from "./PerformanceMonitor";
import DropdownPortal from "./DropdownPortal";

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
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const genreButtonRef = useRef(null);
  const regionButtonRef = useRef(null);

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
    { code: "US", name: "United States", flag: "us" },
    { code: "GB", name: "United Kingdom", flag: "gb" },
    { code: "CA", name: "Canada", flag: "ca" },
    { code: "AU", name: "Australia", flag: "au" },
    { code: "DE", name: "Germany", flag: "de" },
    { code: "FR", name: "France", flag: "fr" },
    { code: "JP", name: "Japan", flag: "jp" },
    { code: "KR", name: "South Korea", flag: "kr" },
    { code: "BR", name: "Brazil", flag: "br" },
    { code: "MX", name: "Mexico", flag: "mx" },
    { code: "IN", name: "India", flag: "in" },
    { code: "IT", name: "Italy", flag: "it" },
    { code: "ES", name: "Spain", flag: "es" },
    { code: "NL", name: "Netherlands", flag: "nl" },
    { code: "SE", name: "Sweden", flag: "se" },
  ];

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
    setShowGenreDropdown(false);
  };

  const handleCountryChange = (country) => {
    dispatch(setSelectedCountryAction(country.code));
    setShowRegionDropdown(false);
  };

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
            <div className="relative">
              <button
                ref={genreButtonRef}
                onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                className="w-full flex items-center gap-3 px-4 py-2.5 bg-white/[0.08] hover:bg-white/[0.12] 
                  backdrop-blur-md rounded-xl transition-all duration-200 border border-white/20 
                  hover:border-white/30 group pointer-events-auto"
              >
                <Icon
                  icon={genreIcons[selectedGenre] || "mdi:music-note"}
                  className="w-4 h-4 text-[#14b8a6]"
                />
                <span className="text-white font-medium text-sm flex-1 text-left">
                  {genreTitle}
                </span>
                <IoChevronDown
                  className={`text-white/60 transition-all duration-200 w-3 h-3 ${
                    showGenreDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              <DropdownPortal
                isOpen={showGenreDropdown}
                onClose={() => setShowGenreDropdown(false)}
                triggerRef={genreButtonRef}
                minWidth={200}
                maxHeight={262}
                placement="bottom-start"
                offset={-312}
                className="bg-[#1a1848] border border-white/20 rounded-xl translate-x-1"
              >
                <div className="py-2">
                  <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
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
                  <div className="py-1">
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
              </DropdownPortal>
            </div>
          )}

          {/* Region Selector */}
          {showRegionSelector && (
            <div className="relative">
              <button
                ref={regionButtonRef}
                onClick={() => setShowRegionDropdown(!showRegionDropdown)}
                className="w-full flex items-center gap-3 px-4 py-2.5 bg-white/[0.08] hover:bg-white/[0.12] 
                  backdrop-blur-md rounded-xl transition-all duration-200 border border-white/20 
                  hover:border-white/30 group pointer-events-auto"
              >
                <Icon
                  icon={`circle-flags:${selectedCountryFlag}`}
                  className="w-4 h-4"
                />
                <span className="text-white font-medium text-sm flex-1 text-left">
                  {selectedCountryName}
                </span>
                <IoChevronDown
                  className={`text-white/60 transition-all duration-200 w-3 h-3 ${
                    showRegionDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              <DropdownPortal
                isOpen={showRegionDropdown}
                onClose={() => setShowRegionDropdown(false)}
                triggerRef={regionButtonRef}
                minWidth={200}
                maxHeight={262}
                placement="bottom-start"
                offset={-312}
                className="bg-[#1a1848] border border-white/20 rounded-xl translate-x-1"
              >
                <div className="py-2">
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
                  <div className="py-1">
                    {countries.map((country) => {
                      const isSelected = country.code === selectedCountry;
                      return (
                        <button
                          key={country.code}
                          onClick={() => handleCountryChange(country)}
                          className={`w-full flex items-center gap-3 px-4 py-2 transition-all duration-200 ${
                            isSelected
                              ? "text-[#14b8a6] bg-[#14b8a6]/20"
                              : "text-white/80 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          <Icon
                            icon={`circle-flags:${country.flag}`}
                            className="w-4 h-4 flex-shrink-0"
                          />
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
              </DropdownPortal>
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
                  hover:border-white/30 group pointer-events-auto"
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
        } border-r border-white/10 shadow-2xl`}
      >
        <div className="flex items-center justify-between mb-8">
          <img
            src={logo}
            alt="logo"
            onClick={handleLogoClick}
            className="w-32 h-11 object-contain cursor-pointer"
          />
          <IoCloseCircle
            className="w-7 h-7 text-white cursor-pointer hover:text-[#2dd4bf] transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          />
        </div>
        <NavLinks />
      </div>

      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 sm:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default LeftSidebar;
