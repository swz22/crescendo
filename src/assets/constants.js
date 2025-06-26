import {
  HiOutlineHome,
  HiOutlineUserGroup,
  HiOutlineSparkles,
  HiOutlineCollection,
  HiOutlinePhotograph,
} from "react-icons/hi";

export const genres = [
  { title: "Pop", value: "POP", route: "pop" },
  { title: "Hip-Hop", value: "HIP_HOP_RAP", route: "hip-hop" },
  { title: "Dance", value: "DANCE", route: "dance" },
  { title: "Electronic", value: "ELECTRONIC", route: "electronic" },
  { title: "R&B/Soul", value: "SOUL_RNB", route: "rnb-soul" },
  { title: "Alternative", value: "ALTERNATIVE", route: "alternative" },
  { title: "Rock", value: "ROCK", route: "rock" },
  { title: "Latin", value: "LATIN", route: "latin" },
  { title: "Film & TV", value: "FILM_TV", route: "film-tv" },
  { title: "Country", value: "COUNTRY", route: "country" },
  { title: "K-Pop", value: "K_POP", route: "k-pop" },
  { title: "Indie", value: "INDIE", route: "indie" },
  { title: "Metal", value: "METAL", route: "metal" },
  { title: "Jazz", value: "JAZZ", route: "jazz" },
  { title: "Classical", value: "CLASSICAL", route: "classical" },
  { title: "Lo-Fi", value: "LOFI", route: "lo-fi" },
];

export const links = [
  { name: "Discover", to: "/", icon: HiOutlineHome },
  { name: "Top Artists", to: "/top-artists", icon: HiOutlineUserGroup },
  { name: "Top Albums", to: "/top-albums", icon: HiOutlinePhotograph },
  { name: "New Releases", to: "/new-releases", icon: HiOutlineSparkles },
  { name: "Community Playlists", to: "/playlists", icon: HiOutlineCollection },
];
