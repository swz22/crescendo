import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import searchAndGetLinks from 'spotify-preview-finder';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Preview URL cache
const previewCache = new Map();

// API response cache
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

app.use(cors());
app.use(express.json());

let accessToken = null;
let tokenExpiry = null;

// Get Spotify access token
const getSpotifyToken = async () => {
  // Return cached token if still valid
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

// Cache middleware for Spotify API
const cacheMiddleware = (req, res, next) => {
  const cacheKey = req.originalUrl;
  const cached = apiCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Returning cached response for:', cacheKey);
    return res.json(cached.data);
  }
  
  // Override res.json to cache the response
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    apiCache.set(cacheKey, { data, timestamp: Date.now() });
    return originalJson(data);
  };
  
  next();
};

// Spotify API proxy with caching
app.use("/api/spotify", cacheMiddleware, async (req, res) => {
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

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Rate limiting - track last request time
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 3000; // 3 seconds between requests

// Preview endpoint with enhanced logging
app.get('/api/preview/:trackId', async (req, res) => {
  try {
    const trackId = req.params.trackId;
    console.log('Fetching preview for track:', trackId);
    
    // Check cache first
    if (previewCache.has(trackId)) {
      console.log('Returning cached preview for:', trackId);
      return res.json({ preview_url: previewCache.get(trackId) });
    }
    
    // Rate limiting - wait if necessary
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      console.log(`Rate limiting: waiting ${waitTime}ms before request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    lastRequestTime = Date.now();
    
    // Get track details from Spotify
    const token = await getSpotifyToken();
    const trackResponse = await axios.get(
      `https://api.spotify.com/v1/tracks/${trackId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const trackName = trackResponse.data.name;
    const artistName = trackResponse.data.artists[0].name;
    console.log(`Searching for: ${trackName} by ${artistName}`);
    
    try {
      // Search using track name and artist with timeout
      console.log('Calling searchAndGetLinks...');
      const searchQuery = `${trackName} ${artistName}`;
      
      // Add timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Search timeout')), 15000)
      );
      
      const searchPromise = searchAndGetLinks(searchQuery);
      
      const result = await Promise.race([searchPromise, timeoutPromise]);
      
      console.log('Search result:', JSON.stringify(result, null, 2));
      
      if (result.success && result.results && result.results.length > 0) {
        // Find the result that matches our track
        const matchingResult = result.results.find(r => 
          r.spotifyUrl && r.spotifyUrl.includes(trackId)
        ) || result.results[0];
        
        console.log('Matching result:', matchingResult);
        
        if (matchingResult.previewUrls && matchingResult.previewUrls.length > 0) {
          const previewUrl = matchingResult.previewUrls[0];
          console.log('Found preview URL:', previewUrl);
          
          // Cache it
          previewCache.set(trackId, previewUrl);
          
          res.json({ preview_url: previewUrl });
        } else {
          console.log('No preview URLs in result');
          // Cache null to prevent repeated attempts
          previewCache.set(trackId, null);
          res.status(404).json({ error: 'No preview URL found' });
        }
      } else {
        console.log('No results from search or search failed');
        console.log('Result object:', result);
        
        // If rate limited, don't cache the failure
        if (result.error && result.error.includes('429')) {
          console.log('Rate limited - not caching failure');
          res.status(429).json({ error: 'Rate limited - try again later' });
        } else {
          // Cache other failures
          previewCache.set(trackId, null);
          res.status(404).json({ error: 'No results found' });
        }
      }
    } catch (searchError) {
      console.error('Error during search:', searchError.message);
      console.error('Stack trace:', searchError.stack);
      res.status(404).json({ error: 'Search failed: ' + searchError.message });
    }
  } catch (error) {
    console.error('Preview fetch error:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(404).json({ error: 'Preview not found: ' + error.message });
  }
});

// Optional: Clear cache endpoint for development
app.get('/api/cache/clear', (req, res) => {
  apiCache.clear();
  previewCache.clear();
  res.json({ message: 'Cache cleared' });
});

// Optional: Cache stats endpoint
app.get('/api/cache/stats', (req, res) => {
  res.json({
    apiCache: apiCache.size,
    previewCache: previewCache.size,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});