// File: src/components/Searchbar.jsx
// Complete file replacement

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";

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

  return (
    <form
      onSubmit={handleSubmit}
      autoComplete="off"
      className="relative w-full"
    >
      <label htmlFor="search-field" className="sr-only">
        Search all files
      </label>
      <div className="relative group">
        <FiSearch className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
          isFocused ? 'text-[#2dd4bf]' : 'text-gray-400 group-hover:text-gray-300'
        }`} />
        <input
          name="search-field"
          id="search-field"
          className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-full 
                     placeholder-gray-400 outline-none text-base text-white pl-12 pr-4 py-3
                     focus:bg-white/10 focus:border-[#2dd4bf]/50 focus:shadow-[0_0_20px_rgba(45,212,191,0.2)] transition-all duration-300
                     hover:bg-white/[0.07] hover:border-white/20"
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
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </form>
  );
};

export default Searchbar;