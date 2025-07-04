export const getTrackId = (track) => {
  if (!track) return null;
  return track?.key || track?.id || track?.track_id || null;
};

export const isSameTrack = (track1, track2) => {
  if (!track1 || !track2) return false;

  const id1 = getTrackId(track1);
  const id2 = getTrackId(track2);

  if (id1 && id2) {
    return id1 === id2;
  }

  if (track1.title && track2.title) {
    return track1.title === track2.title;
  }
  return false;
};

export const getTrackImage = (track) => {
  if (!track) return "";

  return (
    track?.images?.coverart ||
    track?.album?.images?.[0]?.url ||
    track?.images?.background ||
    track?.share?.image ||
    track?.hub?.image ||
    ""
  );
};

export const getTrackArtist = (track) => {
  if (!track) return "Unknown Artist";

  return (
    track?.subtitle ||
    track?.artists?.[0]?.name ||
    track?.artist ||
    "Unknown Artist"
  );
};

export const getTrackArtistId = (track) => {
  if (!track?.artists?.[0]) return null;

  return track.artists[0].adamid || track.artists[0].id || null;
};

export const getTrackTitle = (track) => {
  if (!track) return "Unknown Title";

  return track?.title || track?.name || "Unknown Title";
};

export const getTrackPreviewUrl = (track) => {
  if (!track) return "";

  return (
    track?.preview_url ||
    track?.url ||
    track?.hub?.actions?.[1]?.uri ||
    track?.hub?.actions?.[0]?.uri ||
    ""
  );
};

export const isTrackPlayable = (track) => {
  return !!getTrackPreviewUrl(track);
};

// Format duration
export const formatTrackDuration = (ms) => {
  if (!ms || isNaN(ms)) return "0:00";

  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const getTrackArtists = (track) => {
  if (!track?.artists || !Array.isArray(track.artists)) {
    return getTrackArtist(track);
  }

  return (
    track.artists
      .map((artist) => artist.name || artist.alias || "")
      .filter(Boolean)
      .join(", ") || "Unknown Artist"
  );
};

export const isTrackPlaying = (track, currentTrack, isPlaying) => {
  return isPlaying && isSameTrack(track, currentTrack);
};
