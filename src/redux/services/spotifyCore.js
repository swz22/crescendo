import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const adaptTrackData = (track) => {
  return {
    key: track.id,
    title: track.name,
    subtitle: track.artists?.map((artist) => artist.name).join(", "),
    artists: track.artists,
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
    duration_ms: track.duration_ms,
    album: track.album,
    track: track,
    spotify_uri: track.uri,
    external_urls: track.external_urls,
  };
};

const adaptArtistData = (artist) => ({
  adamid: artist.id,
  name: artist.name,
  images: {
    background: artist.images?.[0]?.url || "",
    coverart: artist.images?.[0]?.url || "",
  },
  genres: artist.genres,
  followers: artist.followers?.total,
  popularity: artist.popularity,
  artist: artist,
});

export const spotifyCoreApi = createApi({
  reducerPath: "spotifyCoreApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:3001/api/spotify",
  }),
  keepUnusedDataFor: 300,
  refetchOnMountOrArgChange: false,
  endpoints: (builder) => ({
    getTopCharts: builder.query({
      query: (market = "US") =>
        `/search?q=top%2050%20${market}%202024&type=track&limit=50&market=${market}`,
      transformResponse: (response) => {
        const tracks = response.tracks?.items?.map(adaptTrackData) || [];
        return tracks.sort(
          (a, b) => (b.track?.popularity || 0) - (a.track?.popularity || 0)
        );
      },
    }),

    getTopArtists: builder.query({
      query: () => "/search?q=year:2024&type=artist&limit=20&market=US",
      transformResponse: (response) => {
        const artists =
          response.artists?.items?.map((artist) => ({
            ...adaptArtistData(artist),
            coverart: artist.images?.[0]?.url || "",
          })) || [];
        return artists;
      },
    }),

    getSongDetails: builder.query({
      query: ({ songid }) => `/tracks/${songid}`,
      transformResponse: (response) => adaptTrackData(response),
    }),

    getAlbumDetails: builder.query({
      query: ({ albumId }) => `/albums/${albumId}`,
      transformResponse: (response) => ({
        id: response.id,
        name: response.name,
        artists: response.artists,
        images: response.images,
        release_date: response.release_date,
        total_tracks: response.total_tracks,
        album_type: response.album_type,
        label: response.label,
        popularity: response.popularity,
        genres: response.genres || [],
        copyrights: response.copyrights,
        external_urls: response.external_urls,
      }),
    }),

    getAlbumTracks: builder.query({
      query: ({ albumId }) => `/albums/${albumId}/tracks?limit=50`,
      transformResponse: (response, meta, arg) =>
        response.items?.map((track) =>
          adaptTrackData({
            ...track,
            album: {
              id: arg.albumId, // Use arg.albumId instead of just albumId
              images: [], // Album images will come from album details
            },
          })
        ) || [],
    }),

    getArtistDetails: builder.query({
      query: ({ artistid }) => `/artists/${artistid}`,
      transformResponse: (response) => adaptArtistData(response),
    }),

    getArtistTopTracks: builder.query({
      query: ({ artistid }) => `/artists/${artistid}/top-tracks?market=US`,
      transformResponse: (response) =>
        response.tracks?.map(adaptTrackData) || [],
    }),

    getSongRelated: builder.query({
      query: ({ songid }) => `/recommendations?seed_tracks=${songid}&limit=20`,
      transformResponse: (response) =>
        response.tracks?.map(adaptTrackData) || [],
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
          WORLDWIDE: "global",
          REGGAE: "reggae",
          HOUSE: "house",
          K_POP: "k-pop",
          INDIE: "indie",
          METAL: "metal",
          JAZZ: "jazz",
          CLASSICAL: "classical",
          BLUES: "blues",
          PUNK: "punk",
          FUNK: "funk",
          GOSPEL: "gospel",
          DISCO: "disco",
          LOFI: "lo-fi",
        };

        const genreQuery = genreMap[genre] || "pop";
        return `/search?q=genre:${encodeURIComponent(
          genreQuery
        )}&type=track&limit=50&market=US`;
      },
      transformResponse: (response) => {
        const tracks = response.tracks?.items?.map(adaptTrackData) || [];
        return tracks.sort(
          (a, b) => (b.track?.popularity || 0) - (a.track?.popularity || 0)
        );
      },
    }),

    getSongsBySearch: builder.query({
      query: (searchTerm) =>
        `/search?q=${encodeURIComponent(searchTerm)}&type=track&limit=50`,
      transformResponse: (response) => {
        const tracks = response.tracks?.items?.map(adaptTrackData) || [];
        return { tracks: { hits: tracks.map((track) => ({ track })) } };
      },
    }),

    getNewReleases: builder.query({
      query: () => "/browse/new-releases?country=US&limit=50",
      transformResponse: (response) => response.albums?.items || [],
    }),

    getFeaturedPlaylists: builder.query({
      query: () => "/search?q=owner:spotify&type=playlist&limit=50&market=US",
      transformResponse: (response) => ({
        message: "Spotify Curated Playlists",
        playlists: response.playlists?.items || [],
      }),
    }),

    getPlaylistTracks: builder.query({
      query: ({ playlistId }) => `/playlists/${playlistId}/tracks?limit=50`,
      transformResponse: (response) =>
        response.items
          ?.filter((item) => item && item.track)
          .map((item) => adaptTrackData(item.track)) || [],
    }),

    getTrackFeatures: builder.query({
      query: ({ songid }) => `/audio-features/${songid}`,
      transformResponse: (response) => {
        if (!response || typeof response === "string") return null;

        return {
          key: {
            name:
              response.key === 0
                ? "C"
                : response.key === 1
                ? "C♯/D♭"
                : response.key === 2
                ? "D"
                : response.key === 3
                ? "D♯/E♭"
                : response.key === 4
                ? "E"
                : response.key === 5
                ? "F"
                : response.key === 6
                ? "F♯/G♭"
                : response.key === 7
                ? "G"
                : response.key === 8
                ? "G♯/A♭"
                : response.key === 9
                ? "A"
                : response.key === 10
                ? "A♯/B♭"
                : response.key === 11
                ? "B"
                : "Unknown",
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
