import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Error,
  Loader,
  SongCard,
  AppHeader,
  ResponsiveGrid,
} from "../components";
import { useGetSongsBySearchQuery } from "../redux/services/spotifyCore";

const Search = () => {
  const { searchTerm } = useParams();
  const navigate = useNavigate();
  const { isPlaying } = useSelector((state) => state.player);
  const { data, isFetching, error } = useGetSongsBySearchQuery(searchTerm);

  const songs =
    data?.tracks?.hits?.map((hit) => hit.track) ||
    data?.tracks ||
    data?.hits?.map((hit) => hit.track) ||
    data ||
    [];

  if (isFetching) return <Loader title={`Searching ${searchTerm}...`} />;

  if (error) return <Error />;

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Search Results"
        subtitle={`Showing results for "${searchTerm}"`}
        showSearch={true}
      />

      {songs.length ? (
        <ResponsiveGrid type="songs">
          {songs.map((song, i) => (
            <SongCard
              key={song.key || song.id || i}
              song={song}
              isPlaying={isPlaying}
              data={songs}
              i={i}
            />
          ))}
        </ResponsiveGrid>
      ) : (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400 text-xl">
            No results found for "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  );
};

export default Search;
