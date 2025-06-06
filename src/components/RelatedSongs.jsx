import SongBar from "./SongBar";

const RelatedSongs = ({
  data,
  artistId,
  isPlaying,
  activeSong,
  handlePauseClick,
  handlePlayClick,
}) => {
  // Handle the case where data might be undefined or empty
  const songs = data || [];
  
  return (
    <div className="flex flex-col">
      <h1 className="font-bold text-3xl text-white">
        {artistId ? "Top Songs:" : "Related Songs:"}
      </h1>
      <div className="mt-6 w-full flex flex-col">
        {songs.length > 0 ? (
          songs.map((song, i) => (
            <SongBar
              key={`${artistId || 'related'}-${song.key || song.id || i}`}
              song={song}
              i={i}
              artistId={artistId}
              isPlaying={isPlaying}
              activeSong={activeSong}
              handlePauseClick={handlePauseClick}
              handlePlayClick={handlePlayClick}
            />
          ))
        ) : (
          <p className="text-gray-400 text-base my-1">
            No {artistId ? 'top songs' : 'related songs'} found.
          </p>
        )}
      </div>
    </div>
  );
};

export default RelatedSongs;