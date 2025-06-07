import { useState, useEffect } from "react";
import { useGetPlaylistTracksQuery } from "../redux/services/spotifyCore";

const PlaylistCard = ({ playlist, onClick, onClickWithMosaic }) => {
  const [mosaicImages, setMosaicImages] = useState([]);
  
  // Create a simple placeholder as data URI to avoid network requests
  const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNGE1NTY4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2EwYWVjMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
  
  // Fetch tracks to get album covers for mosaic
  const { data: tracks } = useGetPlaylistTracksQuery(
    { playlistId: playlist.id },
    { skip: false } // Always fetch to get album covers
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
        const albumImage = track.images?.coverart || track.album?.images?.[0]?.url;
        
        // Skip if no image or if it's a placeholder
        if (!albumImage || 
            albumImage.includes('placeholder') || 
            albumImage.includes('2a96cbd8b46e442fc41c2b86b821562f')) {
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
            artistId
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
            if (uniqueCovers.length < 4 && !uniqueCovers.includes(artistAlbums[i].albumImage)) {
              uniqueCovers.push(artistAlbums[i].albumImage);
            }
          }
          if (uniqueCovers.length >= 4) break;
        }
      }
      
      // Final fallback: use playlist cover
      if (uniqueCovers.length < 4 && playlist.images?.[0]?.url) {
        const playlistCover = playlist.images[0].url;
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
    } else if (playlist.images?.[0]?.url) {
      // No tracks loaded yet, use playlist cover for all 4 quadrants
      const playlistCover = playlist.images[0].url;
      setMosaicImages([playlistCover, playlistCover, playlistCover, playlistCover]);
    }
  }, [tracks, playlist]);

  const totalTracks = playlist.tracks?.total || 0;

  const handleClick = () => {
    if (onClickWithMosaic) {
      onClickWithMosaic(playlist, mosaicImages);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className="w-full p-4 bg-white/5 bg-opacity-80 backdrop-blur-sm animate-slideup rounded-lg card-hover cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative w-full aspect-square mb-4">
        {mosaicImages.length === 4 ? (
          // Check if all images are the same (playlist cover fallback)
          mosaicImages.every(img => img === mosaicImages[0]) && mosaicImages[0] !== placeholderImage ? (
            // Show single playlist cover instead of 4 identical quadrants
            <img
              alt="playlist_cover"
              src={mosaicImages[0]}
              className="w-full h-full rounded-lg object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = placeholderImage;
              }}
            />
          ) : (
            // Show mosaic grid
            <div className="grid grid-cols-2 gap-1 w-full h-full rounded-lg overflow-hidden">
              {mosaicImages.map((image, index) => (
                <img
                  key={index}
                  alt={`Album ${index + 1}`}
                  src={image}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = placeholderImage;
                  }}
                />
              ))}
            </div>
          )
        ) : (
          // Fallback while loading
          <img
            alt="playlist_cover"
            src={playlist.images?.[0]?.url || placeholderImage}
            className="w-full h-full rounded-lg object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = placeholderImage;
            }}
          />
        )}
        <div className="absolute bottom-2 right-2 bg-black/70 rounded-full px-3 py-1">
          <p className="text-xs text-white font-medium">{totalTracks} tracks</p>
        </div>
      </div>
      
      <div className="min-w-0">
        <h3 className="font-bold text-base sm:text-lg text-white truncate mb-1">
          {playlist.name}
        </h3>
        <p className="text-xs sm:text-sm text-gray-300 truncate">
          by {playlist.owner?.display_name || 'Spotify'}
        </p>
      </div>
    </div>
  );
};

export default PlaylistCard;