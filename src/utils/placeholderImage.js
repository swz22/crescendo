// Utility to generate local placeholder images without external dependencies

export const createPlaceholder = (width = 400, height = 400, text = 'No Image') => {
  // Create a data URI SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#4a5568;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2d3748;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad1)"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${Math.min(width, height) / 10}" fill="#a0aec0" text-anchor="middle" dy=".3em">${text}</text>
    </svg>
  `;
  
  // Convert to base64 data URI
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Pre-generated placeholders for common sizes to avoid repeated generation
export const PLACEHOLDER_IMAGES = {
  small: createPlaceholder(64, 64, 'No Image'),
  medium: createPlaceholder(240, 240, 'No Image'),
  large: createPlaceholder(400, 400, 'No Image'),
  song: createPlaceholder(400, 400, '♪'),
  artist: createPlaceholder(400, 400, 'Artist'),
  album: createPlaceholder(400, 400, 'Album'),
  noSong: createPlaceholder(240, 240, 'No Song'),
};

// Helper function to get appropriate placeholder
export const getPlaceholder = (type = 'large', customText = null) => {
  if (customText) {
    return createPlaceholder(400, 400, customText);
  }
  return PLACEHOLDER_IMAGES[type] || PLACEHOLDER_IMAGES.large;
};