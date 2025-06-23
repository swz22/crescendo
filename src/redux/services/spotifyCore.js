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
    id: artist.id,
  };
};

// Genre name mappings for better search results
const genreSearchTerms = {
  POP: "Pop",
  HIP_HOP_RAP: "Hip-Hop",
  DANCE: "Dance Electronic",
  ELECTRONIC: "Electronic",
  SOUL_RNB: "R&B Soul",
  ALTERNATIVE: "Alternative",
  ROCK: "Rock",
  LATIN: "Latin",
  FILM_TV: "Soundtrack",
  COUNTRY: "Country",
  K_POP: "K-Pop",
  INDIE: "Indie",
  METAL: "Metal",
  JAZZ: "Jazz",
  CLASSICAL: "Classical",
  LOFI: "Lo-Fi",
};

// Quality filters for playlists
const isQualityPlaylist = (playlist) => {
  if (!playlist) return false;

  const name = playlist.name?.toLowerCase() || "";
  const description = playlist.description?.toLowerCase() || "";

  // Exclude low-quality playlists
  const excludeTerms = [
    "karaoke",
    "tribute",
    "cover",
    "instrumental",
    "remix only",
    "kidz",
  ];
  if (
    excludeTerms.some(
      (term) => name.includes(term) || description.includes(term)
    )
  ) {
    return false;
  }

  // Prefer playlists with good indicators
  const hasGoodFollowers = (playlist.followers?.total || 0) > 5000;
  const isVerified =
    playlist.owner?.display_name === "Spotify" ||
    playlist.owner?.id === "spotify";
  const hasRecentTracks = playlist.tracks?.total > 20;

  return hasGoodFollowers || isVerified || hasRecentTracks;
};

// Build dynamic search queries for genre playlists
const buildGenrePlaylistQuery = (genreKey) => {
  const genreName = genreSearchTerms[genreKey] || genreKey;
  const year = new Date().getFullYear();

  // Build search terms
  const searchTerms = [
    `"This Is ${genreName}"`,
    `"${genreName} Essentials"`,
    `"Top ${genreName} ${year}"`,
    `"${genreName} Hits"`,
  ];

  return searchTerms.join(" OR ");
};

export const spotifyCoreApi = createApi({
  reducerPath: "spotifyCoreApi",
  baseQuery: baseQueryWithRetry,
  endpoints: (builder) => ({
    // Updated genre endpoint using playlist discovery
    getSongsByGenre: builder.query({
      queryFn: async (genre, api, extraOptions, baseQuery) => {
        try {
          const searchQuery = buildGenrePlaylistQuery(genre);

          // Step 1: Search for playlists
          const playlistSearch = await baseQuery({
            url: `/search?q=${encodeURIComponent(
              searchQuery
            )}&type=playlist&limit=20&market=US`,
          });

          if (playlistSearch.error) {
            return { error: playlistSearch.error };
          }

          const playlists = playlistSearch.data?.playlists?.items || [];

          // Step 2: Filter for quality playlists
          const qualityPlaylists = playlists
            .filter(isQualityPlaylist)
            .sort((a, b) => {
              // Prioritize Spotify official playlists
              const aIsSpotify = a.owner?.id === "spotify" ? 1 : 0;
              const bIsSpotify = b.owner?.id === "spotify" ? 1 : 0;
              if (aIsSpotify !== bIsSpotify) return bIsSpotify - aIsSpotify;

              // Then by follower count
              return (b.followers?.total || 0) - (a.followers?.total || 0);
            })
            .slice(0, 4); // Get top 4 playlists

          if (qualityPlaylists.length === 0) {
            // Fallback to traditional search if no playlists found
            const fallbackSearch = await baseQuery({
              url: `/search?q=${genreSearchTerms[genre]}&type=track&limit=50&market=US`,
            });

            if (fallbackSearch.error) {
              return { error: fallbackSearch.error };
            }

            const tracks = fallbackSearch.data?.tracks?.items || [];
            return {
              data: tracks.map(adaptTrackData).filter(Boolean).slice(0, 48),
            };
          }

          // Step 3: Fetch tracks from each playlist
          const allTracks = [];
          const trackIds = new Set();

          for (const playlist of qualityPlaylists) {
            try {
              const tracksResponse = await baseQuery({
                url: `/playlists/${playlist.id}/tracks?limit=50&market=US`,
              });

              if (!tracksResponse.error && tracksResponse.data?.items) {
                const playlistTracks = tracksResponse.data.items
                  .filter((item) => item?.track && !item.track.is_local)
                  .map((item) => item.track)
                  .filter((track) => {
                    // Deduplicate
                    if (trackIds.has(track.id)) return false;
                    trackIds.add(track.id);

                    // Quality filters
                    const title = track.name?.toLowerCase() || "";
                    if (title.includes("karaoke") || title.includes("tribute"))
                      return false;

                    // Prefer tracks with preview URLs or good popularity
                    return track.popularity > 20;
                  });

                allTracks.push(...playlistTracks);
              }
            } catch (error) {
              console.warn(`Failed to fetch playlist ${playlist.id}:`, error);
            }
          }

          // Step 4: Sort by popularity and limit to 48
          const sortedTracks = allTracks
            .sort((a, b) => b.popularity - a.popularity)
            .map(adaptTrackData)
            .filter(Boolean)
            .slice(0, 48);

          return { data: sortedTracks };
        } catch (error) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
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

    getSongsBySearch: builder.query({
      query: (searchTerm) => {
        if (!searchTerm) return { data: [] };
        return `/search?q=${encodeURIComponent(
          searchTerm
        )}&type=track,artist,album&limit=20&market=US`;
      },
      transformResponse: (response) => {
        const tracks = response?.tracks?.items || [];
        const artists = response?.artists?.items || [];
        const albums = response?.albums?.items || [];

        return {
          tracks: tracks.map(adaptTrackData).filter(Boolean),
          artists: artists.map(adaptArtistData).filter(Boolean),
          albums: albums || [],
        };
      },
      transformErrorResponse: (response) => {
        return {
          status: response.status,
          data: response.data || { error: "Search failed" },
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
          data: response.data || { error: "Failed to fetch top tracks" },
        };
      },
    }),

    getTopArtists: builder.query({
      query: (country = "US") =>
        `/search?q=popular&type=artist&market=${country}&limit=50`,
      transformResponse: (response) => {
        const artists = response?.artists?.items || [];
        return artists
          .filter((artist) => artist && artist.popularity > 50)
          .sort((a, b) => b.popularity - a.popularity)
          .slice(0, 50)
          .map((artist) => ({
            ...artist,
            alias: artist.name,
            avatar: artist.images?.[0]?.url || "",
            coverart: artist.images?.[0]?.url || "",
            images: {
              background: artist.images?.[0]?.url || "",
              coverart: artist.images?.[0]?.url || "",
            },
          }))
          .filter(Boolean);
      },
      transformErrorResponse: (response) => {
        return {
          status: response.status,
          data: response.data || { error: "Failed to fetch artists" },
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
  }),
});

export const {
  useGetTopArtistsQuery,
  useGetSongDetailsQuery,
  useGetAlbumDetailsQuery,
  useGetAlbumTracksQuery,
  useGetArtistDetailsQuery,
  useGetArtistTopTracksQuery,
  useGetSongsByGenreQuery,
  useGetSongsBySearchQuery,
  useGetNewReleasesQuery,
  useGetFeaturedPlaylistsQuery,
  useGetPlaylistTracksQuery,
} = spotifyCoreApi;
