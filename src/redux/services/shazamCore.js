import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const shazamCoreApi = createApi({
  reducerPath: "shazamCoreApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://shazam.p.rapidapi.com/",
    prepareHeaders: (headers) => {
      headers.set("X-RapidAPI-Key", import.meta.env.VITE_SHAZAM_CORE_RAPID_API_KEY);
      headers.set("X-RapidAPI-Host", import.meta.env.VITE_SHAZAM_API_HOST);
      
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getTopCharts: builder.query({ 
      query: () => "charts/track",
      transformResponse: (response) => {
        console.log('TopCharts raw response:', response);
        return response;
      },
      keepUnusedDataFor: 3600,
    }),
    getChartsList: builder.query({
      query: () => "charts/list",
      transformResponse: (response) => {
        console.log('ChartsList raw response:', response);
        return response;
      },
      keepUnusedDataFor: 86400,
    }),
    getSongsByGenre: builder.query({
      query: (genreListId) => {
        const url = `charts/track?listId=${genreListId}&pageSize=20&startFrom=0`;
        console.log('Genre request URL:', url);
        return url;
      },
      transformResponse: (response) => {
        console.log('Genre raw response:', response);
        return response;
      },
      keepUnusedDataFor: 3600,
    }),
    getSongsByCountry: builder.query({
      query: (countryCode) => `charts/track?listId=${countryCode}&pageSize=20&startFrom=0`,
      transformResponse: (response) => {
        console.log('Country raw response:', response);
        return response;
      },
      keepUnusedDataFor: 3600,
    }),
    getSongsBySearch: builder.query({
      query: (searchTerm) => `search?term=${searchTerm}&locale=en-US&offset=0&limit=5`,
      transformResponse: (response) => {
        console.log('Search raw response:', response);
        return response;
      },
      keepUnusedDataFor: 3600,
    }),
    getArtistDetails: builder.query({
      query: (artistId) => `artists/get-details?id=${artistId}&l=en-US`,
      keepUnusedDataFor: 3600,
    }),
    getSongDetails: builder.query({
      query: ({ songid }) => `songs/get-details?key=${songid}&locale=en-US`,
      keepUnusedDataFor: 3600,
    }),
    getSongRelated: builder.query({
      query: ({ songid }) => `songs/list-recommendations?key=${songid}&locale=en-US`,
      keepUnusedDataFor: 3600,
    }),
  }),
});

export const {
  useGetTopChartsQuery,
  useGetChartsListQuery,
  useGetSongsByGenreQuery,
  useGetSongsByCountryQuery,
  useGetSongsBySearchQuery,
  useGetArtistDetailsQuery,
  useGetSongDetailsQuery,
  useGetSongRelatedQuery,
} = shazamCoreApi;