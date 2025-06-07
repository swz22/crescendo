import { useState, useCallback, useRef } from 'react';

// In-memory cache for preview URLs
const previewCache = new Map();

const fetchPreviewUrl = async (trackId) => {
  // Check cache first
  if (previewCache.has(trackId)) {
    console.log('Returning cached preview URL for:', trackId);
    return previewCache.get(trackId);
  }

  try {
    console.log('Fetching preview URL for track:', trackId);
    const response = await fetch(`http://localhost:3001/api/preview/${trackId}`);
    const data = await response.json();
    console.log('Preview URL response:', data);
    
    // Cache the result
    if (data.preview_url) {
      previewCache.set(trackId, data.preview_url);
    }
    
    return data.preview_url;
  } catch (error) {
    console.error('Failed to fetch preview URL:', error);
    return null;
  }
};

export const usePreviewUrl = () => {
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef(null);

  const getPreviewUrl = useCallback(async (song) => {
    console.log('getPreviewUrl called with song:', song);
    
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (song.preview_url) {
      console.log('Song already has preview_url:', song.preview_url);
      return song;
    }
    
    // Check for track ID in different possible locations
    const trackId = song.key || song.id || song.track_id;
    
    if (!trackId) {
      console.log('Song has no track ID:', song);
      return song;
    }
    
    // Check cache first before making network request
    const cachedUrl = previewCache.get(trackId);
    if (cachedUrl) {
      console.log('Using cached preview URL:', cachedUrl);
      return { ...song, preview_url: cachedUrl, url: cachedUrl };
    }
    
    setLoading(true);
    abortControllerRef.current = new AbortController();
    
    try {
      const previewUrl = await fetchPreviewUrl(trackId);
      
      if (previewUrl) {
        console.log('Successfully fetched preview URL:', previewUrl);
        return { ...song, preview_url: previewUrl, url: previewUrl };
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
    
    console.log('No preview URL found for song');
    return song;
  }, []); // Empty dependency array since fetchPreviewUrl and cache are stable

  return { getPreviewUrl, loading };
};