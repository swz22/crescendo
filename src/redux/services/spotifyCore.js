// src/redux/services/spotifyCore.js
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
    track_id: track.id, // Add this for fetching preview later
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
  endpoints: (builder) => ({
    searchMulti: builder.query({
      query: (searchTerm) =>
        `/search?q=${encodeURIComponent(
          searchTerm
        )}&type=track,artist,album&limit=50`,
      transformResponse: (response) => ({
        tracks: response.tracks?.items?.map(adaptTrackData) || [],
        artists: response.artists?.items?.map(adaptArtistData) || [],
        albums: response.albums?.items || [],
      }),
    }),

getTopCharts: builder.query({
  query: () => '/search?q=top%202024%20kpop%20OR%20billboard&type=track&limit=50',
  transformResponse: (response) => {
    const tracks = response.tracks?.items?.map(adaptTrackData) || [];
    return tracks.sort((a, b) => (b.track?.popularity || 0) - (a.track?.popularity || 0));
  },
}),

    getTopTracks: builder.query({
      query: () => "/search?q=popular%202024&type=track&limit=50&market=US",
      transformResponse: (response) => {
        const tracks = response.tracks?.items?.map(adaptTrackData) || [];
        return tracks;
      },
    }),

 getTopArtists: builder.query({
  query: () => "/search?q=year:2024&type=artist&limit=20&market=US",
  transformResponse: (response) => {
    const artists = response.artists?.items?.map(artist => ({
      ...adaptArtistData(artist),
      // Ensure we have the coverart field for ArtistCard
      coverart: artist.images?.[0]?.url || ''
    })) || [];
    return artists;
  },
}),

    getSongDetails: builder.query({
      query: ({ songid }) => `/tracks/${songid}`,
      transformResponse: (response) => adaptTrackData(response),
    }),

    getAudioFeatures: builder.query({
      query: ({ songid }) => `/audio-features/${songid}`,
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

    getRelatedArtists: builder.query({
      query: ({ artistid }) => `/artists/${artistid}/related-artists`,
      transformResponse: (response) =>
        response.artists?.map(adaptArtistData) || [],
    }),

    getSongRelated: builder.query({
      query: ({ songid }) => `/recommendations?seed_tracks=${songid}&limit=30`,
      transformResponse: (response) =>
        response.tracks?.map(adaptTrackData) || [],
    }),

    getSongsByGenre: builder.query({
      query: (genre) => {
        const genreMap = {
          POP: "taylor swift",
          HIP_HOP_RAP: "drake",
          DANCE: "david guetta",
          ELECTRONIC: "deadmau5",
          SOUL_RNB: "the weeknd",
          ALTERNATIVE: "imagine dragons",
          ROCK: "foo fighters",
          LATIN: "bad bunny",
          FILM_TV: "hans zimmer",
          COUNTRY: "morgan wallen",
          WORLDWIDE: "ed sheeran",
          REGGAE_DANCE_HALL: "bob marley",
          HOUSE: "swedish house mafia",
          K_POP: "bts",
        };

        const searchQuery = genreMap[genre] || "popular songs";
        return `/search?q=${encodeURIComponent(
          searchQuery
        )}&type=track&limit=50&market=US`;
      },
      transformResponse: (response) => {
        const tracks = response.tracks?.items?.map(adaptTrackData) || [];
        console.log(`Genre search: ${tracks.length} total tracks`);
        return tracks;
      },
    }),

    getNewReleases: builder.query({
      query: () => "/browse/new-releases?limit=50",
      transformResponse: (response) => response.albums?.items || [],
    }),

    getFeaturedPlaylists: builder.query({
      query: () => "/browse/featured-playlists?limit=20",
      transformResponse: (response) => response.playlists?.items || [],
    }),

    getSongsBySearch: builder.query({
      query: (searchTerm) =>
        `/search?q=${encodeURIComponent(searchTerm)}&type=track&limit=50`,
      transformResponse: (response) =>
        response.tracks?.items?.map(adaptTrackData) || [],
    }),

    getArtistsBySearch: builder.query({
      query: (searchTerm) =>
        `/search?q=${encodeURIComponent(searchTerm)}&type=artist&limit=20`,
      transformResponse: (response) =>
        response.artists?.items?.map(adaptArtistData) || [],
    }),
  }),
});

export const {
  useSearchMultiQuery,
  useGetTopChartsQuery,
  useGetTopTracksQuery,
  useGetSongDetailsQuery,
  useGetAudioFeaturesQuery,
  useGetArtistDetailsQuery,
  useGetArtistTopTracksQuery,
  useGetRelatedArtistsQuery,
  useGetSongRelatedQuery,
  useGetSongsByGenreQuery,
  useGetNewReleasesQuery,
  useGetFeaturedPlaylistsQuery,
  useGetSongsBySearchQuery,
  useGetArtistsBySearchQuery,
  useGetTopArtistsQuery,
} = spotifyCoreApi;
