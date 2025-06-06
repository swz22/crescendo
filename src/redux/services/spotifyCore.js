import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const adaptTrackData = (track) => {
  if (!track.preview_url) {
    console.log("No preview URL for track:", track.name);
  }

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
      query: () => '/search?q=top%2050%20global%202024&type=track&limit=50',
      transformResponse: (response) => {
        const tracks = response.tracks?.items?.map(adaptTrackData) || [];
        return tracks.sort((a, b) => (b.track?.popularity || 0) - (a.track?.popularity || 0));
      },
    }),

    getTopArtists: builder.query({
      query: () => "/search?q=year:2024&type=artist&limit=20&market=US",
      transformResponse: (response) => {
        const artists = response.artists?.items?.map(artist => ({
          ...adaptArtistData(artist),
          coverart: artist.images?.[0]?.url || ''
        })) || [];
        return artists;
      },
    }),

    getSongDetails: builder.query({
      query: ({ songid }) => `/tracks/${songid}`,
      transformResponse: (response) => adaptTrackData(response),
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
          REGGAE_DANCE_HALL: "reggae",
          HOUSE: "house",
          K_POP: "k-pop",
        };

        const genreQuery = genreMap[genre] || "pop";
        return `/search?q=genre:${encodeURIComponent(genreQuery)}&type=track&limit=50&market=US`;
      },
      transformResponse: (response) => {
        const tracks = response.tracks?.items?.map(adaptTrackData) || [];
        return tracks.sort((a, b) => (b.track?.popularity || 0) - (a.track?.popularity || 0));
      },
    }),

    getSongsBySearch: builder.query({
      query: (searchTerm) =>
        `/search?q=${encodeURIComponent(searchTerm)}&type=track&limit=50`,
      transformResponse: (response) => {
        const tracks = response.tracks?.items?.map(adaptTrackData) || [];
        return { tracks: { hits: tracks.map(track => ({ track })) } };
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
        playlists: response.playlists?.items || []
      }),
    }),

    getPlaylistTracks: builder.query({
      query: ({ playlistId }) => `/playlists/${playlistId}/tracks?limit=50`,
      transformResponse: (response) =>
        response.items?.map(item => adaptTrackData(item.track)).filter(track => track) || [],
    }),
  }),
});

export const {
  useGetTopChartsQuery,
  useGetTopArtistsQuery,
  useGetSongDetailsQuery,
  useGetArtistDetailsQuery,
  useGetArtistTopTracksQuery,
  useGetSongRelatedQuery,
  useGetSongsByGenreQuery,
  useGetSongsBySearchQuery,
  useGetNewReleasesQuery,
  useGetFeaturedPlaylistsQuery,
  useGetPlaylistTracksQuery,
} = spotifyCoreApi;