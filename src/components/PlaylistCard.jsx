import { useState, useEffect, useMemo } from "react";
import { useGetPlaylistTracksQuery } from "../redux/services/spotifyCore";

const PlaylistCard = ({ playlist, onClick, onClickWithMosaic, isFeatured }) => {
  const [mosaicImages, setMosaicImages] = useState([]);

  // Add null safety
  if (!playlist) {
    return null;
  }

  // Memoize the safe playlist to prevent infinite re-renders
  const safePlaylist = useMemo(
    () => ({
      id: playlist.id || `playlist-${Date.now()}`,
      name: playlist.name || "Untitled Playlist",
      images: playlist.images || [],
      owner: playlist.owner || {},
      tracks: playlist.tracks || {},
      ...playlist,
    }),
    [playlist]
  );

  // Create a simple placeholder as data URI to avoid network requests
  const placeholderImage =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNGE1NTY4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2EwYWVjMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";

  // Fetch tracks to get album covers for mosaic
  const { data: tracks } = useGetPlaylistTracksQuery(
    { playlistId: safePlaylist.id },
    { skip: !safePlaylist.id }
  );

  useEffect(() => {
    if (tracks && tracks.length > 0) {
      const uniqueCovers = [];
      const seenAlbumIds = new Set();
      const albumsByArtist = new Map(); // Track albums per artist

      // First pass: Try to get unique albums from different artists
      for (const track of tracks) {
        if (!track) continue;

        const albumId = track.album?.id || track.track_id;
        const artistId = track.artists?.[0]?.id || track.artists?.[0]?.adamid;
        const albumImage =
          track.images?.coverart || track.album?.images?.[0]?.url;

        // Skip if no image or if it's a placeholder
        if (
          !albumImage ||
          albumImage.includes("placeholder") ||
          albumImage.includes("2a96cbd8b46e442fc41c2b86b821562f")
        ) {
          continue;
        }

        // Track albums by artist
        if (artistId && albumId && !seenAlbumIds.has(albumId)) {
          if (!albumsByArtist.has(artistId)) {
            albumsByArtist.set(artistId, []);
          }
          albumsByArtist.get(artistId).push({
            albumId,
            albumImage,
            artistId,
          });
          seenAlbumIds.add(albumId);
        }
      }

      // Try to get one album from each artist first
      const artistIds = Array.from(albumsByArtist.keys());
      for (let i = 0; i < Math.min(4, artistIds.length); i++) {
        const artistAlbums = albumsByArtist.get(artistIds[i]);
        if (artistAlbums && artistAlbums.length > 0) {
          uniqueCovers.push(artistAlbums[0].albumImage);
        }
      }

      // If we still need more covers, add more albums from artists we've already used
      if (uniqueCovers.length < 4) {
        for (const artistAlbums of albumsByArtist.values()) {
          for (let i = 1; i < artistAlbums.length; i++) {
            if (
              uniqueCovers.length < 4 &&
              !uniqueCovers.includes(artistAlbums[i].albumImage)
            ) {
              uniqueCovers.push(artistAlbums[i].albumImage);
            }
          }
          if (uniqueCovers.length >= 4) break;
        }
      }

      // Final fallback: use playlist cover
      if (uniqueCovers.length < 4 && safePlaylist.images?.[0]?.url) {
        const playlistCover = safePlaylist.images[0].url;
        while (uniqueCovers.length < 4) {
          uniqueCovers.push(playlistCover);
        }
      } else {
        // If still not enough, fill with placeholder
        while (uniqueCovers.length < 4) {
          uniqueCovers.push(placeholderImage);
        }
      }

      setMosaicImages(uniqueCovers);
    } else if (safePlaylist.images?.[0]?.url) {
      // No tracks loaded yet, use playlist cover for all 4 quadrants
      const playlistCover = safePlaylist.images[0].url;
      setMosaicImages([
        playlistCover,
        playlistCover,
        playlistCover,
        playlistCover,
      ]);
    }
  }, [tracks, safePlaylist]);

  const totalTracks = safePlaylist.tracks?.total || 0;

  const handleClick = () => {
    if (onClickWithMosaic) {
      onClickWithMosaic(safePlaylist, mosaicImages);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={`w-full p-2 xs:p-3 sm:p-4 bg-white/5 bg-opacity-80 backdrop-blur-sm 
        animate-slideup rounded-lg cursor-pointer relative transition-all duration-200 
        active:scale-[0.98] sm:hover:scale-105 ${
          isFeatured ? "ring-2 ring-[#14b8a6] ring-opacity-50" : ""
        }`}
      onClick={handleClick}
    >
      {/* Featured badge */}
      {isFeatured && (
        <div
          className="absolute top-1 right-1 xs:top-2 xs:right-2 bg-gradient-to-r from-[#14b8a6] to-[#0d9488] 
          text-white text-[9px] xs:text-xs px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-full z-10 font-bold"
        >
          Featured
        </div>
      )}

      <div className="relative w-full aspect-square mb-2 xs:mb-3 sm:mb-4">
        {isFeatured &&
        safePlaylist.name.toLowerCase().includes("lonely heart") ? (
          <img
            src={
              safePlaylist.images?.[0]?.url ||
              mosaicImages[0] ||
              placeholderImage
            }
            alt={safePlaylist.name}
            className="w-full h-full object-cover rounded-md xs:rounded-lg shadow-xl"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = placeholderImage;
            }}
          />
        ) : (
          // 2x2 mosaic
          <div className="grid grid-cols-2 gap-0.5 w-full h-full rounded-md xs:rounded-lg overflow-hidden shadow-xl">
            {mosaicImages.slice(0, 4).map((img, index) => (
              <img
                key={index}
                src={img || placeholderImage}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = placeholderImage;
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-0.5 xs:space-y-1">
        <h3
          className="font-semibold text-[11px] xs:text-xs sm:text-sm text-white 
          truncate xs:whitespace-normal xs:line-clamp-2 leading-tight"
        >
          {safePlaylist.name}
        </h3>
        <p className="text-[10px] xs:text-xs text-gray-400">
          {safePlaylist.owner?.display_name || "Spotify"}
        </p>
      </div>
    </div>
  );
};

export default PlaylistCard;
