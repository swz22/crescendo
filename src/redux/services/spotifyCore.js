import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getAuthHeaders } from './spotifyAuth';

const adaptTrackData = (track) => ({
  key: track.id,
  title: track.name,
  subtitle: track.artists?.map(artist => artist.name).join(', '),
  artists: track.artists,
  images: {
    coverart: track.album?.images?.[0]?.url || '',
    background: track.album?.images?.[0]?.url || '',
  },
  hub: {
    actions: [{
      uri: track.preview_url || ''
    }]
  },
  preview_url: track.preview_url,
  duration_ms: track.duration_ms,
  album: track.album,
  track: track,
  spotify_uri: track.uri,
  external_urls: track.external_urls,
});

const adaptArtistData = (artist) => ({
  adamid: artist.id,
  name: artist.name,
  images: {
    background: artist.images?.[0]?.url || '',
    coverart: artist.images?.[0]?.url || '',
  },
  genres: artist.genres,
  followers: artist.followers?.total,
  popularity: artist.popularity,
  artist: artist,
});

export const spotifyCoreApi = createApi({
  reducerPath: 'spotifyCoreApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api.spotify.com/v1',
    prepareHeaders: async (headers) => {
      const authHeaders = await getAuthHeaders();
      Object.entries(authHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });
      return headers;
    },
  }),
  endpoints: (builder) => ({
    searchMulti: builder.query({
      query: (searchTerm) => `/search?q=${encodeURIComponent(searchTerm)}&type=track,artist,album&limit=20`,
      transformResponse: (response) => ({
        tracks: response.tracks?.items?.map(adaptTrackData) || [],
        artists: response.artists?.items?.map(adaptArtistData) || [],
        albums: response.albums?.items || [],
      }),
    }),

    getTopCharts: builder.query({
      query: () => '/playlists/37i9dQZEVXbMDoHDwVN2tF/tracks?limit=50', // Global Top 50
      transformResponse: (response) => 
        response.items?.map(item => adaptTrackData(item.track)).filter(track => track.preview_url) || [],
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
        response.tracks?.map(adaptTrackData).filter(track => track.preview_url) || [],
    }),

    getRelatedArtists: builder.query({
      query: ({ artistid }) => `/artists/${artistid}/related-artists`,
      transformResponse: (response) => 
        response.artists?.map(adaptArtistData) || [],
    }),

    getSongRelated: builder.query({
      query: ({ songid }) => `/recommendations?seed_tracks=${songid}&limit=20`,
      transformResponse: (response) => 
        response.tracks?.map(adaptTrackData).filter(track => track.preview_url) || [],
    }),

    getSongsByGenre: builder.query({
      query: (genre) => `/search?q=genre:${encodeURIComponent(genre)}&type=track&limit=50`,
      transformResponse: (response) => 
        response.tracks?.items?.map(adaptTrackData).filter(track => track.preview_url) || [],
    }),

    getNewReleases: builder.query({
      query: () => '/browse/new-releases?limit=50',
      transformResponse: (response) => 
        response.albums?.items || [],
    }),

    getFeaturedPlaylists: builder.query({
      query: () => '/browse/featured-playlists?limit=20',
      transformResponse: (response) => 
        response.playlists?.items || [],
    }),

    // Search tracks only
    getSongsBySearch: builder.query({
      query: (searchTerm) => `/search?q=${encodeURIComponent(searchTerm)}&type=track&limit=50`,
      transformResponse: (response) => 
        response.tracks?.items?.map(adaptTrackData).filter(track => track.preview_url) || [],
    }),

    // Search artists only
    getArtistsBySearch: builder.query({
      query: (searchTerm) => `/search?q=${encodeURIComponent(searchTerm)}&type=artist&limit=20`,
      transformResponse: (response) => 
        response.artists?.items?.map(adaptArtistData) || [],
    }),
  }),
});

export const {
  useSearchMultiQuery,
  useGetTopChartsQuery,
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
} = spotifyCoreApi;