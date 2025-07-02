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

export const isTrackPlaying = (track, currentTrack, isPlaying) => {
  return isPlaying && isSameTrack(track, currentTrack);
};
