import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";

const Searchbar = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

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
        <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-white transition-colors" />
        <input
          name="search-field"
          id="search-field"
          className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-full 
                     placeholder-gray-400 outline-none text-base text-white pl-12 pr-4 py-2
                     focus:bg-white/10 focus:border-[#8b5cf6]/50 transition-all duration-200
                     hover:bg-white/[0.07]"
          placeholder="Search for songs, artists..."
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </form>
  );
};

export default Searchbar;