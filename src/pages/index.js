import { lazy } from "react";

const Discover = lazy(() => import("./Discover"));
const TopAlbums = lazy(() => import("./TopAlbums"));
const TopArtists = lazy(() => import("./TopArtists"));
const AlbumDetails = lazy(() => import("./AlbumDetails"));
const ArtistDetails = lazy(() => import("./ArtistDetails"));
const SongDetails = lazy(() => import("./SongDetails"));
const Search = lazy(() => import("./Search"));
const NewReleases = lazy(() => import("./NewReleases"));
const CommunityPlaylists = lazy(() => import("./CommunityPlaylists"));
const MyPlaylists = lazy(() => import("./MyPlaylists"));

export {
  Discover,
  Search,
  TopAlbums,
  TopArtists,
  AlbumDetails,
  ArtistDetails,
  SongDetails,
  NewReleases,
  CommunityPlaylists,
  MyPlaylists,
};
