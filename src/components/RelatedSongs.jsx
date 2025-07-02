import TrackRow from "./TrackRow";

const RelatedSongs = ({
  data,
  artistId,
  isPlaying,
  handlePauseClick,
  handlePlayClick,
}) => {
  const songs = data || [];

  return (
    <div className="flex flex-col">
      <h1 className="font-bold text-3xl text-white">
        {artistId ? "Top Songs:" : "Related Songs:"}
      </h1>
      <div className="mt-6 w-full flex flex-col">
        {songs.length > 0 ? (
          songs.map((song, i) => (
            <TrackRow
              key={`${artistId || "related"}-${song.key || song.id || i}`}
              song={song}
              i={i}
              artistId={artistId}
              isPlaying={isPlaying}
              handlePauseClick={handlePauseClick}
              handlePlayClick={() => handlePlayClick(song, i)}
            />
          ))
        ) : (
          <p className="text-gray-400 text-base my-1">
            No {artistId ? "top songs" : "related songs"} found.
          </p>
        )}
      </div>
    </div>
  );
};

export default RelatedSongs;
