import { useState, useCallback } from 'react';

const fetchPreviewUrl = async (trackId) => {
  try {
    const response = await fetch(`http://localhost:3001/api/preview/${trackId}`);
    const data = await response.json();
    return data.preview_url;
  } catch (error) {
    console.error('Failed to fetch preview URL:', error);
    return null;
  }
};

export const usePreviewUrl = () => {
  const [loading, setLoading] = useState(false);

  const getPreviewUrl = useCallback(async (song) => {
    if (song.preview_url) return song;
    
    if (!song.key) return song;
    
    setLoading(true);
    const previewUrl = await fetchPreviewUrl(song.key);
    setLoading(false);
    
    if (previewUrl) {
      return { ...song, preview_url: previewUrl, url: previewUrl };
    }
    return song;
  }, []);

  return { getPreviewUrl, loading };
};