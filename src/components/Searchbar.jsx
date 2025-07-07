import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { HiOutlineX } from "react-icons/hi";

const Searchbar = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search/${searchTerm.trim()}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="w-full">
      <label htmlFor="search-field" className="sr-only">
        Search all files
      </label>
      <div className="relative group">
        <FiSearch
          className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-all duration-300 ${
            isFocused ? "text-[#2dd4bf] scale-110" : "text-gray-400 group-hover:text-gray-300"
          }`}
        />
        <input
          name="search-field"
          id="search-field"
          className="w-full bg-white/[0.08] backdrop-blur-xl border border-white/20 rounded-full 
            placeholder-gray-400 outline-none text-sm text-white pl-10 pr-10 py-2
            focus:bg-white/[0.12] focus:border-[#14b8a6]/50 focus:shadow-[0_0_30px_rgba(45,212,191,0.3)] 
            transition-all duration-300 hover:bg-white/10 hover:border-white/30"
          placeholder="Search songs..."
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-white transition-all duration-200 hover:scale-110"
          >
            <HiOutlineX className="w-4 h-4" />
          </button>
        )}
        {/* Glow effect on focus */}
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-r from-[#2dd4bf]/10 to-[#14b8a6]/10 blur-2xl transition-opacity duration-300 pointer-events-none ${
            isFocused ? "opacity-60" : "opacity-0"
          }`}
        />
      </div>
    </form>
  );
};

export default Searchbar;
