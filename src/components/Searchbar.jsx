import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { HiOutlineLightBulb } from "react-icons/hi";
import { showOnboardingModal } from "./OnboardingModal";

const Searchbar = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search/${searchTerm}`);
    }
  };

  const handleShowTour = () => {
    showOnboardingModal();
  };

  return (
    <div className="flex items-center gap-3 w-full">
      <button
        onClick={handleShowTour}
        className="p-3 bg-white/[0.08] hover:bg-white/[0.12] rounded-full transition-all duration-300 group hover:scale-110 backdrop-blur-sm border border-white/20"
        title="Show app tour"
      >
        <HiOutlineLightBulb className="w-5 h-5 text-[#2dd4bf] group-hover:text-[#14b8a6] transition-colors" />
      </button>

      <form
        onSubmit={handleSubmit}
        autoComplete="off"
        className="relative flex-1"
      >
        <label htmlFor="search-field" className="sr-only">
          Search all files
        </label>
        <div className="relative group">
          <FiSearch
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-all duration-300 ${
              isFocused
                ? "text-[#2dd4bf] scale-110"
                : "text-gray-400 group-hover:text-gray-300"
            }`}
          />
          <input
            name="search-field"
            id="search-field"
            className="w-full bg-white/[0.08] backdrop-blur-xl border border-white/20 rounded-full 
                       placeholder-gray-400 outline-none text-base text-white pl-12 pr-4 py-3
                       focus:bg-white/[0.12] focus:border-[#2dd4bf]/50 focus:shadow-[0_0_30px_rgba(45,212,191,0.3)] 
                       transition-all duration-300 hover:bg-white/10 hover:border-white/30"
            placeholder="Search for songs, artists..."
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-all duration-200 hover:scale-110"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
          {/* Glow effect on focus */}
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-r from-[#2dd4bf]/20 to-[#14b8a6]/20 blur-xl transition-opacity duration-300 pointer-events-none ${
              isFocused ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>
      </form>
    </div>
  );
};

export default Searchbar;
