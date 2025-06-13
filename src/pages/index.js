import { lazy } from "react";

// Lazy load all page components for better performance
const Discover = lazy(() => import("./Discover"));
const TopArtists = lazy(() => import("./TopArtists"));
const AlbumDetails = lazy(() => import("./AlbumDetails"));
const ArtistDetails = lazy(() => import("./ArtistDetails"));
const SongDetails = lazy(() => import("./SongDetails"));
const Search = lazy(() => import("./Search"));
const NewReleases = lazy(() => import("./NewReleases"));
const CommunityPlaylists = lazy(() => import("./CommunityPlaylists"));

export {
  Discover,
  Search,
  TopArtists,
  AlbumDetails,
  ArtistDetails,
  SongDetails,
  NewReleases,
  CommunityPlaylists,
};
