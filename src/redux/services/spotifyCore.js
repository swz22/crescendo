import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Get API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Custom base query with retry logic
const baseQueryWithRetry = async (args, api, extraOptions) => {
  const baseQuery = fetchBaseQuery({
    baseUrl: `${API_URL}/api/spotify`,
    timeout: 30000,
  });

  let result = await baseQuery(args, api, extraOptions);

  // Retry on 5xx errors or network failures
  let retries = 0;
  while (
    retries < MAX_RETRIES &&
    (result.error?.status >= 500 ||
      result.error?.originalStatus >= 500 ||
      result.error?.error === "FETCH_ERROR")
  ) {
    await new Promise((resolve) =>
      setTimeout(resolve, RETRY_DELAY * Math.pow(2, retries))
    );
    result = await baseQuery(args, api, extraOptions);
    retries++;
  }

  // Log persistent errors
  if (result.error) {
    console.error("Spotify API error:", {
      endpoint: args.url || args,
      error: result.error,
      retries,
    });
  }

  return result;
};

const adaptTrackData = (track) => {
  if (!track) return null;

  return {
    key: track.id,
    title: track.name || "Unknown Title",
    subtitle:
      track.artists?.map((artist) => artist.name).join(", ") ||
      "Unknown Artist",
    artists: track.artists || [],
    images: {
      coverart: track.album?.images?.[0]?.url || "",
      background: track.album?.images?.[0]?.url || "",
    },
    hub: {
      actions: [
        {
          uri: track.preview_url || "",
        },
      ],
    },
    preview_url: track.preview_url,
    url: track.preview_url,
    track_id: track.id,
    duration_ms: track.duration_ms || 0,
    album: track.album || {},
    track: track,
    spotify_uri: track.uri,
    external_urls: track.external_urls || {},
  };
};

const adaptArtistData = (artist) => {
  if (!artist) return null;

  return {
    adamid: artist.id,
    name: artist.name || "Unknown Artist",
    images: {
      background: artist.images?.[0]?.url || "",
      coverart: artist.images?.[0]?.url || "",
    },
    genres: artist.genres || [],
    followers: artist.followers?.total || 0,
    popularity: artist.popularity || 0,
    artist: artist,
  };
};

export const spotifyCoreApi = createApi({
  reducerPath: "spotifyCoreApi",
  baseQuery: baseQueryWithRetry,
  keepUnusedDataFor: 300,
  refetchOnMountOrArgChange: false,
  endpoints: (builder) => ({
    getTopCharts: builder.query({
      query: (market = "US") =>
        `/search?q=top%2050%20${market}%202024&type=track&limit=50&market=${market}`,
      transformResponse: (response) => {
        if (!response?.tracks?.items) return [];
        const tracks = response.tracks.items
          .map(adaptTrackData)
          .filter(Boolean);
        return tracks.sort(
          (a, b) => (b.track?.popularity || 0) - (a.track?.popularity || 0)
        );
      },
      transformErrorResponse: (response) => {
        return {
          status: response.status,
          data: response.data || { error: "Failed to fetch top charts" },
        };
      },
    }),

    getTopArtists: builder.query({
      query: (region = "US") =>
        `/search?q=year:2024&type=artist&limit=30&market=${region}`,
      transformResponse: (response) => {
        if (!response?.artists?.items) return [];
        const artists = response.artists.items
          .map((artist) => ({
            ...adaptArtistData(artist),
            coverart: artist.images?.[0]?.url || "",
          }))
          .filter(Boolean);
        return artists;
      },
      transformErrorResponse: (response) => {
        return {
          status: response.status,
          data: response.data || { error: "Failed to fetch artists" },
        };
      },
    }),

    getSongDetails: builder.query({
      query: ({ songid }) => {
        if (!songid) throw new Error("Song ID is required");
        return `/tracks/${songid}`;
      },
      transformResponse: (response) => adaptTrackData(response),
      transformErrorResponse: (response) => {
        return {
          status: response.status,
          data: response.data || { error: "Failed to fetch song details" },
        };
      },
    }),

    getAlbumDetails: builder.query({
      query: ({ albumId }) => {
        if (!albumId) throw new Error("Album ID is required");
        return `/albums/${albumId}`;
      },
      transformResponse: (response) => {
        if (!response) return null;
        return {
          id: response.id,
          name: response.name || "Unknown Album",
          artists: response.artists || [],
          images: response.images || [],
          release_date: response.release_date,
          total_tracks: response.total_tracks || 0,
          album_type: response.album_type,
          label: response.label,
          popularity: response.popularity || 0,
          genres: response.genres || [],
          copyrights: response.copyrights || [],
          external_urls: response.external_urls || {},
        };
      },
      transformErrorResponse: (response) => {
        return {
          status: response.status,
          data: response.data || { error: "Failed to fetch album details" },
        };
      },
    }),

    getAlbumTracks: builder.query({
      query: ({ albumId }) => {
        if (!albumId) throw new Error("Album ID is required");
        return `/albums/${albumId}/tracks?limit=50`;
      },
      transformResponse: (response, meta, arg) => {
        if (!response?.items) return [];
        return response.items
          .map((track) =>
            adaptTrackData({
              ...track,
              album: {
                id: arg.albumId,
                images: [], // Album images will come from album details
              },
            })
          )
          .filter(Boolean);
      },
      transformErrorResponse: (response) => {
        return {
          status: response.status,
          data: response.data || { error: "Failed to fetch album tracks" },
        };
      },
    }),

    getArtistDetails: builder.query({
      query: ({ artistid }) => {
        if (!artistid) throw new Error("Artist ID is required");
        return `/artists/${artistid}`;
      },
      transformResponse: (response) => adaptArtistData(response),
      transformErrorResponse: (response) => {
        return {
          status: response.status,
          data: response.data || { error: "Failed to fetch artist details" },
        };
      },
    }),

    getArtistTopTracks: builder.query({
      query: ({ artistid }) => {
        if (!artistid) throw new Error("Artist ID is required");
        return `/artists/${artistid}/top-tracks?market=US`;
      },
      transformResponse: (response) => {
        if (!response?.tracks) return [];
        return response.tracks.map(adaptTrackData).filter(Boolean);
      },
      transformErrorResponse: (response) => {
        return {
          status: response.status,
          data: response.data || { error: "Failed to fetch artist top tracks" },
        };
      },
    }),

    getSongRelated: builder.query({
      query: ({ songid }) => {
        if (!songid) throw new Error("Song ID is required");
        return `/recommendations?seed_tracks=${songid}&limit=20`;
      },
      transformResponse: (response) => {
        if (!response?.tracks) return [];
        return response.tracks.map(adaptTrackData).filter(Boolean);
      },
      transformErrorResponse: (response) => {
        return {
          status: response.status,
          data: response.data || { error: "Failed to fetch related songs" },
        };
      },
    }),

    getSongsByGenre: builder.query({
      query: (genre) => {
        const genreMap = {
          POP: "pop",
          HIP_HOP_RAP: "hip-hop",
          DANCE: "dance",
          ELECTRONIC: "electronic",
          SOUL_RNB: "r&b",
          ALTERNATIVE: "alternative",
          ROCK: "rock",
          LATIN: "latin",
          FILM_TV: "soundtrack",
          COUNTRY: "country",
          K_POP: "k-pop",
          INDIE: "indie",
          METAL: "metal",
          JAZZ: "jazz",
          CLASSICAL: "classical",
          LOFI: "study",
        };

        const spotifyGenre = genreMap[genre] || "pop";
        return `/search?q=genre:"${spotifyGenre}"&type=track&limit=50`;
      },
      transformResponse: (response) => {
        if (!response?.tracks?.items) return [];
        return response.tracks.items.map(adaptTrackData).filter(Boolean);
      },
      transformErrorResponse: (response) => {
        return {
          status: response.status,
          data: response.data || { error: "Failed to fetch songs by genre" },
        };
      },
    }),

    getSongsBySearch: builder.query({
      query: (searchTerm) => {
        if (!searchTerm) throw new Error("Search term is required");
        return `/search?q=${encodeURIComponent(
          searchTerm
        )}&type=track,artist,album&limit=20`;
      },
      transformResponse: (response) => {
        return {
          tracks: response.tracks?.items?.map(adaptTrackData) || [],
          artists:
            response.artists?.items?.map((artist) => ({
              ...adaptArtistData(artist),
              type: "artist",
            })) || [],
          albums:
            response.albums?.items?.map((album) => ({
              id: album.id,
              name: album.name,
              artists: album.artists,
              images: album.images,
              release_date: album.release_date,
              total_tracks: album.total_tracks,
              type: "album",
            })) || [],
        };
      },
      transformErrorResponse: (response) => {
        return {
          status: response.status,
          data: response.data || { error: "Failed to search" },
        };
      },
    }),

    getNewReleases: builder.query({
      query: () => "/browse/new-releases?country=US&limit=50",
      transformResponse: (response) => response?.albums?.items || [],
      transformErrorResponse: (response) => {
        return {
          status: response.status,
          data: response.data || { error: "Failed to fetch new releases" },
        };
      },
    }),

    getFeaturedPlaylists: builder.query({
      query: () => "/search?q=owner:spotify&type=playlist&limit=50&market=US",
      transformResponse: (response) => ({
        message: "Spotify Curated Playlists",
        playlists: response?.playlists?.items || [],
      }),
      transformErrorResponse: (response) => {
        return {
          status: response.status,
          data: response.data || { error: "Failed to fetch playlists" },
        };
      },
    }),

    getPlaylistTracks: builder.query({
      query: ({ playlistId }) => {
        if (!playlistId) throw new Error("Playlist ID is required");
        return `/playlists/${playlistId}/tracks?limit=50`;
      },
      transformResponse: (response) => {
        if (!response?.items) return [];
        return response.items
          .filter((item) => item && item.track)
          .map((item) => adaptTrackData(item.track))
          .filter(Boolean);
      },
      transformErrorResponse: (response) => {
        return {
          status: response.status,
          data: response.data || { error: "Failed to fetch playlist tracks" },
        };
      },
    }),

    getTrackFeatures: builder.query({
      query: ({ songid }) => {
        if (!songid) throw new Error("Song ID is required");
        return `/audio-features/${songid}`;
      },
      transformResponse: (response) => {
        if (!response || typeof response === "string") return null;

        const keyNames = [
          "C",
          "C♯/D♭",
          "D",
          "D♯/E♭",
          "E",
          "F",
          "F♯/G♭",
          "G",
          "G♯/A♭",
          "A",
          "A♯/B♭",
          "B",
        ];

        return {
          key: {
            name: keyNames[response.key] || "Unknown",
            number: response.key,
          },
          mode: response.mode === 1 ? "Major" : "Minor",
          tempo: response.tempo ? Math.round(response.tempo) : null,
          energy: response.energy ? Math.round(response.energy * 100) : null,
          danceability: response.danceability
            ? Math.round(response.danceability * 100)
            : null,
          happiness: response.valence
            ? Math.round(response.valence * 100)
            : null,
          acousticness: response.acousticness
            ? Math.round(response.acousticness * 100)
            : null,
          speechiness: response.speechiness
            ? Math.round(response.speechiness * 100)
            : null,
          liveness: response.liveness
            ? Math.round(response.liveness * 100)
            : null,
          loudness: response.loudness ? Math.round(response.loudness) : null,
          duration: response.duration_ms
            ? Math.round(response.duration_ms / 1000)
            : null,
        };
      },
      // Don't throw errors for this endpoint
      transformErrorResponse: (response) => {
        console.log("Audio features not available");
        return { error: "Audio features not available" };
      },
    }),
  }),
});

export const {
  useGetTopChartsQuery,
  useGetTopArtistsQuery,
  useGetSongDetailsQuery,
  useGetAlbumDetailsQuery,
  useGetAlbumTracksQuery,
  useGetArtistDetailsQuery,
  useGetArtistTopTracksQuery,
  useGetSongRelatedQuery,
  useGetSongsByGenreQuery,
  useGetSongsBySearchQuery,
  useGetNewReleasesQuery,
  useGetFeaturedPlaylistsQuery,
  useGetPlaylistTracksQuery,
  useGetTrackFeaturesQuery,
} = spotifyCoreApi;
