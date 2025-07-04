import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

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

  // Handle different image formats from different endpoints
  const getArtistImage = () => {
    if (Array.isArray(artist.images) && artist.images.length > 0) {
      return artist.images[0].url;
    }
    if (artist.images?.background) {
      return artist.images.background;
    }
    if (artist.images?.coverart) {
      return artist.images.coverart;
    }
    if (artist.avatar) {
      return artist.avatar;
    }
    return "";
  };

  const imageUrl = getArtistImage();

  return {
    adamid: artist.id,
    id: artist.id,
    name: artist.name || "Unknown Artist",
    alias: artist.name || "Unknown Artist",
    avatar: imageUrl,
    images: {
      background: imageUrl,
      coverart: imageUrl,
    },
    genres: artist.genres || [],
    followers: artist.followers?.total || 0,
    popularity: artist.popularity || 0,
  };
};

const genreSearchTerms = {
  POP: "Pop",
  HIP_HOP_RAP: "Hip-Hop",
  DANCE: "Dance",
  ELECTRONIC: "Electronic",
  SOUL_RNB: "R&B Soul",
  ALTERNATIVE: "Alternative",
  ROCK: "Rock",
  LATIN: "Latin",
  FILM_TV: "Film Score",
  COUNTRY: "Country",
  K_POP: "K-pop",
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

          // Search for playlists
          const playlistSearch = await baseQuery({
            url: `/search?q=${encodeURIComponent(
              searchQuery
            )}&type=playlist&limit=20&market=US`,
          });

          if (playlistSearch.error) {
            return { error: playlistSearch.error };
          }

          const playlists = playlistSearch.data?.playlists?.items || [];

          // Filter for quality playlists
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
              data: tracks.map(adaptTrackData).filter(Boolean).slice(0, 50),
            };
          }

          // Fetch tracks from each playlist
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

          // Sort by popularity
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

    getArtistAlbums: builder.query({
      query: ({ artistId }) => {
        if (!artistId) throw new Error("Artist ID is required");
        return `/artists/${artistId}/albums?include_groups=album,single&market=US&limit=50`;
      },
      transformResponse: (response) => {
        if (!response?.items) return [];

        const processedAlbums = response.items.map((album) => ({
          ...album,
          id: album.id,
          name: album.name,
          images: album.images || [],
          release_date: album.release_date,
          album_type: album.album_type,
          artists: album.artists || [],
          total_tracks: album.total_tracks || 0,
        }));

        // Sort by release date and remove duplicates
        const uniqueAlbums = processedAlbums
          .filter(
            (album, index, self) =>
              index === self.findIndex((a) => a.name === album.name)
          )
          .sort((a, b) => {
            const dateA = new Date(a.release_date || "1900-01-01");
            const dateB = new Date(b.release_date || "1900-01-01");
            return dateB - dateA; // Newest first
          });

        return uniqueAlbums;
      },
      transformErrorResponse: (response) => {
        return {
          status: response.status,
          data: response.data || { error: "Failed to fetch artist albums" },
        };
      },
    }),

    getRecommendedArtists: builder.query({
      queryFn: async (artistId, api, extraOptions, baseQuery) => {
        try {
          const artistResponse = await baseQuery({
            url: `/artists/${artistId}`,
          });

          if (artistResponse.error) {
            return { error: artistResponse.error };
          }

          const artistData = artistResponse.data;
          const artistGenres = artistData?.genres || [];

          const genreMapping = {
            pop: "pop",
            "hip hop": "hip-hop",
            rap: "hip-hop",
            dance: "dance",
            electronic: "electronic",
            edm: "electronic",
            "r&b": "r&b",
            soul: "r&b",
            alternative: "alternative",
            rock: "rock",
            latin: "latin",
            reggaeton: "latin",
            country: "country",
            "k-pop": "k-pop",
            korean: "k-pop",
            indie: "indie",
            metal: "metal",
            jazz: "jazz",
            classical: "classical",
            "lo-fi": "lo-fi",
            lofi: "lo-fi",
          };

          let searchGenre = "pop";

          for (const artistGenre of artistGenres) {
            const lowerGenre = artistGenre.toLowerCase();
            for (const [key, value] of Object.entries(genreMapping)) {
              if (lowerGenre.includes(key)) {
                searchGenre = value;
                break;
              }
            }
            if (searchGenre !== "pop") break;
          }

          const searchResponse = await baseQuery({
            url: `/search?q=genre:${searchGenre}&type=artist&limit=50&market=US`,
          });

          if (searchResponse.error) {
            const fallbackResponse = await baseQuery({
              url: `/search?q=${searchGenre}&type=artist&limit=50&market=US`,
            });

            if (fallbackResponse.error) {
              return { error: fallbackResponse.error };
            }

            const artists = fallbackResponse.data?.artists?.items || [];
            const relatedArtists = artists
              .filter(
                (artist) => artist.id !== artistId && artist.popularity > 50
              )
              .map((artist) => adaptArtistData(artist))
              .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
              .slice(0, 6);

            return { data: relatedArtists };
          }

          const artists = searchResponse.data?.artists?.items || [];

          const relatedArtists = artists
            .filter(
              (artist) => artist.id !== artistId && artist.popularity > 50
            )
            .map((artist) => adaptArtistData(artist))
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
            .slice(0, 6);

          if (relatedArtists.length < 3) {
            const broadSearchResponse = await baseQuery({
              url: `/search?q=${searchGenre} music&type=artist&limit=50&market=US`,
            });

            if (
              !broadSearchResponse.error &&
              broadSearchResponse.data?.artists?.items
            ) {
              const additionalArtists = broadSearchResponse.data.artists.items
                .filter(
                  (artist) =>
                    artist.id !== artistId &&
                    artist.popularity > 40 &&
                    !relatedArtists.find((a) => a.id === artist.id)
                )
                .map((artist) => adaptArtistData(artist))
                .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

              relatedArtists.push(...additionalArtists);
              return { data: relatedArtists.slice(0, 6) };
            }
          }

          return { data: relatedArtists };
        } catch (error) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },
    }),

    getTopAlbums: builder.query({
      query: ({ country = "US" }) => {
        return `/search?q=year:2024-2025&type=album&market=${country}&limit=50`;
      },
      transformResponse: (response) => {
        if (!response?.albums?.items) return [];

        // Sort by popularity and filter out duplicates
        const uniqueAlbums = response.albums.items
          .filter(
            (album, index, self) =>
              index ===
              self.findIndex(
                (a) =>
                  a.name === album.name &&
                  a.artists[0]?.name === album.artists[0]?.name
              )
          )
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, 50);

        return uniqueAlbums;
      },
      transformErrorResponse: (response) => {
        return {
          status: response.status,
          data: response.data || { error: "Failed to fetch top albums" },
        };
      },

      getRecommendedArtists: builder.query({
        queryFn: async (artistId, api, extraOptions, baseQuery) => {
          try {
            const recommendationsResponse = await baseQuery({
              url: `/recommendations?seed_artists=${artistId}&limit=50&market=US`,
            });

            if (recommendationsResponse.error) {
              return { error: recommendationsResponse.error };
            }

            const tracks = recommendationsResponse.data?.tracks || [];

            // Extract unique artists from the recommended tracks
            const artistMap = new Map();

            tracks.forEach((track) => {
              track.artists?.forEach((artist) => {
                if (artist.id !== artistId && !artistMap.has(artist.id)) {
                  artistMap.set(artist.id, adaptArtistData(artist));
                }
              });
            });

            // Get the first 6 unique artists
            const relatedArtists = Array.from(artistMap.values()).slice(0, 6);

            if (relatedArtists.length < 6) {
              const topTracksResponse = await baseQuery({
                url: `/artists/${artistId}/top-tracks?market=US`,
              });

              if (!topTracksResponse.error && topTracksResponse.data?.tracks) {
                topTracksResponse.data.tracks.forEach((track) => {
                  track.artists?.forEach((artist) => {
                    if (
                      artist.id !== artistId &&
                      !artistMap.has(artist.id) &&
                      relatedArtists.length < 6
                    ) {
                      artistMap.set(artist.id, adaptArtistData(artist));
                      relatedArtists.push(artistMap.get(artist.id));
                    }
                  });
                });
              }
            }

            return { data: relatedArtists };
          } catch (error) {
            return { error: { status: "CUSTOM_ERROR", error: error.message } };
          }
        },
      }),
    }),

    getTopArtists: builder.query({
      query: (country = "US") => {
        const marketSeeds = {
          US: ["taylor swift", "drake", "morgan wallen", "sza"],
          GB: ["ed sheeran", "dua lipa", "harry styles", "sam smith"],
          CA: ["the weeknd", "drake", "justin bieber", "shawn mendes"],
          AU: ["the kid laroi", "tame impala", "troye sivan", "flume"],
          DE: ["apache 207", "robin schulz", "cro", "lea"],
          FR: ["aya nakamura", "david guetta", "gazo", "niska"],
          ES: ["rosalía", "c. tangana", "aitana", "bad gyal"],
          IT: ["maneskin", "mahmood", "blanco", "ultimо"],
          BR: ["anitta", "luan santana", "jorge & mateus", "marília mendonça"],
          MX: ["peso pluma", "karol g", "junior h", "natanael cano"],
          JP: ["yoasobi", "ado", "kenshi yonezu", "lisa"],
          KR: ["newjeans", "blackpink", "bts", "iu"],
          IN: ["arijit singh", "shreya ghoshal", "anuv jain", "armaan malik"],
          NL: ["tiësto", "martin garrix", "flemming", "armin van buuren"],
          SE: ["zara larsson", "avicii", "håkan hellström", "tove lo"],
          TW: ["jay chou", "jolin tsai", "mayday", "eric chou"],
        };

        const seeds = marketSeeds[country];
        const searchQuery = seeds.join(" OR ");

        return `/search?q=${encodeURIComponent(
          searchQuery
        )}&type=artist&market=${country}&limit=50`;
      },
      transformResponse: (response) => {
        const artists = response?.artists?.items || [];

        return artists
          .filter((artist) => {
            return (
              artist && artist.id && artist.name && artist.images?.length > 0
            );
          })
          .filter(
            (artist, index, self) =>
              index === self.findIndex((a) => a.id === artist.id)
          )
          .sort((a, b) => b.popularity - a.popularity)
          .slice(0, 49)
          .map((artist) => ({
            ...artist,
            alias: artist.name,
            avatar: artist.images?.[0]?.url || "",
            coverart: artist.images?.[0]?.url || "",
            images: {
              background: artist.images?.[0]?.url || "",
              coverart: artist.images?.[0]?.url || "",
            },
          }));
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
      query: () => {
        // Search for albums from 2025 only, will be sorted by relevance/popularity by default
        return `/search?q=year:2025&type=album&market=US&limit=49`;
      },
      transformResponse: (response) => {
        // Extract albums and sort by release date (newest first)
        const albums = response?.albums?.items || [];
        return albums.sort((a, b) => {
          const dateA = new Date(a.release_date || "1900-01-01");
          const dateB = new Date(b.release_date || "1900-01-01");
          return dateB - dateA; // Newest first
        });
      },
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
  useGetTopAlbumsQuery,
  useGetTopArtistsQuery,
  useGetSongDetailsQuery,
  useGetAlbumDetailsQuery,
  useGetAlbumTracksQuery,
  useGetArtistDetailsQuery,
  useGetArtistAlbumsQuery,
  useGetRecommendedArtistsQuery,
  useGetArtistTopTracksQuery,
  useGetSongsByGenreQuery,
  useGetSongsBySearchQuery,
  useGetNewReleasesQuery,
  useGetFeaturedPlaylistsQuery,
  useGetPlaylistTracksQuery,
} = spotifyCoreApi;
