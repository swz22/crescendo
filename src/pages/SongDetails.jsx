import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { DetailsHeader, Error, Loader, RelatedSongs } from "../components";
import { setActiveSong, playPause } from "../redux/features/playerSlice";
import {
  useGetSongDetailsQuery,
  useGetArtistTopTracksQuery,
} from "../redux/services/spotifyCore";

const SongDetails = () => {
  const dispatch = useDispatch();
  const { songid } = useParams();
  const { activeSong, isPlaying } = useSelector((state) => state.player);
  
  const { data: songData, isFetching: isFetchingSongDetails, error: songError } =
    useGetSongDetailsQuery({ songid });
  
  // Get the artist ID from the song data
  const artistId = songData?.artists?.[0]?.id;
  
  // Fetch artist's top tracks as related songs
  const { data: relatedData, isFetching: isFetchingRelatedSongs } =
    useGetArtistTopTracksQuery(
      { artistid: artistId },
      { skip: !artistId } // Don't fetch until we have artist ID
    );

  if (isFetchingSongDetails || isFetchingRelatedSongs)
    return <Loader title="Loading song details..." />;

  if (songError) return <Error />;

  const handlePauseClick = () => {
    dispatch(playPause(false));
  };

  const handlePlayClick = (song, i) => {
    dispatch(setActiveSong({ song, data: relatedData || [], i }));
    dispatch(playPause(true));
  };

  // Filter out the current song from related songs
  const relatedSongs = relatedData?.filter(song => song.key !== songid) || [];

  // Format duration
  const formatDuration = (ms) => {
    if (!ms) return 'Unknown';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col">
      <DetailsHeader artistId="" songData={songData} />
      
      <div className="mb-10">
        <h2 className="text-white text-3xl font-bold">Track Information</h2>
        
        {/* Song Info */}
        <div className="mt-5">
          <div className="bg-white/5 p-4 rounded-lg">
            <h3 className="text-white text-xl font-semibold mb-3">Details</h3>
            <p className="text-gray-400 mb-2">
              <span className="text-gray-300">Album:</span> {songData?.album?.name || 'Unknown'}
            </p>
            <p className="text-gray-400 mb-2">
              <span className="text-gray-300">Release Date:</span> {songData?.album?.release_date || 'Unknown'}
            </p>
            <p className="text-gray-400 mb-2">
              <span className="text-gray-300">Duration:</span> {formatDuration(songData?.duration_ms)}
            </p>
            <p className="text-gray-400 mb-2">
              <span className="text-gray-300">Popularity:</span> {songData?.track?.popularity || 'N/A'}/100
            </p>
            {songData?.track?.explicit && (
              <p className="text-gray-400 mb-2">
                <span className="text-red-500">Explicit Content</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-white text-3xl font-bold">Lyrics</h2>
        <div className="mt-5 bg-white/5 p-6 rounded-lg">
          <p className="text-gray-300 text-base mb-4">
            Search for lyrics on your favorite platform:
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={`https://genius.com/search?q=${encodeURIComponent(`${songData?.title} ${songData?.subtitle}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-full font-semibold transition-colors"
            >
              Search on Genius
            </a>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(`${songData?.title} ${songData?.subtitle} lyrics`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full font-semibold transition-colors"
            >
              Google Search
            </a>
            <a
              href={`https://www.azlyrics.com/lyrics/${encodeURIComponent(songData?.subtitle?.toLowerCase().replace(/[^a-z0-9]/g, '') || '')}/${encodeURIComponent(songData?.title?.toLowerCase().replace(/[^a-z0-9]/g, '') || '')}.html`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-full font-semibold transition-colors"
            >
              Try AZLyrics
            </a>
          </div>
          <p className="text-gray-500 text-sm mt-4">
            Due to licensing restrictions, we can't display lyrics directly. Click any button above to find lyrics on external sites.
          </p>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-white text-3xl font-bold mb-6">
          More from {songData?.subtitle || 'this artist'}
        </h2>
        <RelatedSongs
          data={relatedSongs}
          artistId=""
          isPlaying={isPlaying}
          activeSong={activeSong}
          handlePauseClick={handlePauseClick}
          handlePlayClick={handlePlayClick}
        />
      </div>
    </div>
  );
};

export default SongDetails;