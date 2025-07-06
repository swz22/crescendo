import {
  HiOutlineHome,
  HiOutlineUserGroup,
  HiOutlineSparkles,
  HiOutlineCollection,
  HiOutlinePhotograph,
  HiOutlineFolderOpen,
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
  { name: "My Playlists", to: "/my-playlists", icon: HiOutlineFolderOpen },
];

export const countries = [
  { code: "US", name: "United States", flag: "us" },
  { code: "AU", name: "Australia", flag: "au" },
  { code: "BR", name: "Brazil", flag: "br" },
  { code: "CA", name: "Canada", flag: "ca" },
  { code: "DE", name: "Germany", flag: "de" },
  { code: "ES", name: "Spain", flag: "es" },
  { code: "FR", name: "France", flag: "fr" },
  { code: "GB", name: "United Kingdom", flag: "gb" },
  { code: "IN", name: "India", flag: "in" },
  { code: "IT", name: "Italy", flag: "it" },
  { code: "JP", name: "Japan", flag: "jp" },
  { code: "KR", name: "South Korea", flag: "kr" },
  { code: "MX", name: "Mexico", flag: "mx" },
  { code: "NL", name: "Netherlands", flag: "nl" },
  { code: "SE", name: "Sweden", flag: "se" },
  { code: "TW", name: "Taiwan", flag: "tw" },
];

export const genreIcons = {
  POP: "mdi:star-four-points-outline",
  HIP_HOP_RAP: "mdi:microphone-variant",
  DANCE: "mdi:speaker-wireless",
  ELECTRONIC: "mdi:waveform",
  SOUL_RNB: "mdi:heart-multiple",
  ALTERNATIVE: "mdi:vinyl",
  ROCK: "mdi:guitar-electric",
  LATIN: "game-icons:maracas",
  FILM_TV: "mdi:movie-open-outline",
  COUNTRY: "mdi:hat-fedora",
  K_POP: "mdi:heart-settings-outline",
  INDIE: "mdi:cassette",
  METAL: "game-icons:anvil-impact",
  JAZZ: "game-icons:saxophone",
  CLASSICAL: "mdi:piano",
  LOFI: "mdi:coffee-outline",
};
