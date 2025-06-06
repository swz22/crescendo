import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import searchAndGetLinks from "spotify-preview-finder";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const previewCache = new Map();

app.use(cors());
app.use(express.json());

let accessToken = null;
let tokenExpiry = null;

const getSpotifyToken = async () => {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      "grant_type=client_credentials",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(
              `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
            ).toString("base64"),
        },
      }
    );

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + response.data.expires_in * 1000 - 60000;

    return accessToken;
  } catch (error) {
    console.error("Error getting Spotify token:", error);
    throw error;
  }
};

app.use("/api/spotify", async (req, res) => {
  try {
    const token = await getSpotifyToken();
    const spotifyPath = req.originalUrl.replace("/api/spotify/", "");

    console.log("Spotify Token:", token ? "Valid" : "Missing");
    console.log("Requesting Spotify API:", spotifyPath);

    const response = await axios.get(
      `https://api.spotify.com/v1/${spotifyPath}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Full error:", error.response?.data);
    console.error("Status:", error.response?.status);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || "Internal server error",
      details: error.response?.data,
    });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.get("/api/preview/:trackId", async (req, res) => {
  try {
    const trackId = req.params.trackId;
    console.log("Fetching preview for track:", trackId);

    if (previewCache.has(trackId)) {
      console.log("Returning cached preview for:", trackId);
      return res.json({ preview_url: previewCache.get(trackId) });
    }

    if (matchingResult.previewUrls && matchingResult.previewUrls.length > 0) {
      const previewUrl = matchingResult.previewUrls[0];
      console.log("Found preview URL:", previewUrl);
      previewCache.set(trackId, previewUrl);
      res.json({ preview_url: previewUrl });
    } else {
      res.status(404).json({ error: "No preview URL found" });
    }
  } catch (error) {
    console.error("Preview fetch error:", error);
    res.status(404).json({ error: "Preview not found" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
