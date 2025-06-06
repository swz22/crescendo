import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { DetailsHeader, Error, Loader, RelatedSongs } from "../components";
import { setActiveSong, playPause } from "../redux/features/playerSlice";
import {
  useGetSongDetailsQuery,
  useGetSongRelatedQuery,
} from "../redux/services/spotifyCore";

const SongDetails = () => {
  const dispatch = useDispatch();
  const { songid } = useParams();
  const { activeSong, isPlaying } = useSelector((state) => state.player);
  
  const { data: songData, isFetching: isFetchingSongDetails } =
    useGetSongDetailsQuery({ songid });
  
  const { data: relatedData, isFetching: isFetchingRelatedSongs, error } =
    useGetSongRelatedQuery({ songid });

  if (isFetchingSongDetails || isFetchingRelatedSongs)
    return <Loader title="Searching song details" />;

  console.log('Song details data:', songData);
  console.log('Related songs data:', relatedData);

  if (error) return <Error />;

  const handlePauseClick = () => {
    dispatch(playPause(false));
  };

  const handlePlayClick = (song, i) => {
    dispatch(setActiveSong({ song, data: relatedData?.tracks || relatedData || [], i }));
    dispatch(playPause(true));
  };

  // Extract lyrics from different possible locations
  const getLyrics = () => {
    // Check for lyrics in sections
    if (songData?.sections) {
      const lyricsSection = songData.sections.find(
        section => section.type === "LYRICS"
      );
      if (lyricsSection?.text) {
        return lyricsSection.text;
      }
    }
    
    // Check for lyrics in resources
    if (songData?.resources?.lyrics) {
      return Object.values(songData.resources.lyrics)[0]?.attributes?.text;
    }
    
    // Check for lyrics in other possible locations
    if (songData?.lyrics) {
      return songData.lyrics;
    }
    
    return null;
  };

  const lyrics = getLyrics();
  const relatedSongs = relatedData?.tracks || relatedData || [];

  return (
    <div className="flex flex-col">
      <DetailsHeader artistId="" songData={songData} />
      
      <div className="mb-10">
        <h2 className="text-white text-3xl font-bold">Lyrics:</h2>
        <div className="mt-5">
          {lyrics ? (
            Array.isArray(lyrics) ? (
              lyrics.map((line, i) => (
                <p
                  key={`lyrics-${i}`}
                  className="text-gray-400 text-base my-1"
                >
                  {line}
                </p>
              ))
            ) : (
              <p className="text-gray-400 text-base my-1 whitespace-pre-line">
                {lyrics}
              </p>
            )
          ) : (
            <p className="text-gray-400 text-base my-1">
              Sorry, no lyrics found!
            </p>
          )}
        </div>
      </div>

      <RelatedSongs
        data={relatedSongs}
        artistId=""
        isPlaying={isPlaying}
        activeSong={activeSong}
        handlePauseClick={handlePauseClick}
        handlePlayClick={handlePlayClick}
      />
    </div>
  );
};

export default SongDetails;