import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

// Middleware to ensure API route
const ensureApiRoute = (req: VercelRequest, res: VercelResponse, next: () => Promise<void>) => {
  // Set JSON headers
  res.setHeader('Content-Type', 'application/json');
  
  // Always proceed with API request
  return next();
};

// Validate Spotify response data
const validateSpotifyResponse = (data: any) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response data structure');
  }

  // Check for required properties
  const requiredProps = ['tracks', 'artists', 'albums'];
  for (const prop of requiredProps) {
    if (!(prop in data)) {
      throw new Error(`Missing required property: ${prop}`);
    }
  }

  // Validate tracks structure
  if (!Array.isArray(data.tracks?.items)) {
    throw new Error('Invalid tracks structure');
  }

  return true;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Ensure this is an API request
  await ensureApiRoute(req, res, async () => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { query = '', limit = 20 } = req.query;
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        console.error('❌ Spotify credentials not configured');
        return res.status(500).json({ 
          error: 'Spotify credentials not configured',
          details: 'Please add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to environment variables'
        });
      }

      // Get access token
      const tokenResponse = await axios.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          },
        }
      );

      const accessToken = tokenResponse.data.access_token;

      // Make search request
      const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json'
        },
        params: {
          q: query || 'genre:pop year:2024',  // Default to recent popular music if no query
          type: 'track,artist,album',
          limit: parseInt(limit as string),
          market: 'US',
          include_external: 'audio',
        },
      });

      // Validate response data
      try {
        validateSpotifyResponse(searchResponse.data);
      } catch (error: any) {
        console.error('❌ Invalid Spotify API response:', error.message);
        return res.status(500).json({
          error: 'Invalid API response',
          details: error.message
        });
      }

      // Transform response to ensure consistent structure
      const transformedData = {
        tracks: {
          items: searchResponse.data.tracks.items.map((track: any) => ({
            id: track.id,
            name: track.name,
            artists: track.artists,
            album: track.album,
            duration_ms: track.duration_ms,
            preview_url: track.preview_url,
            external_urls: track.external_urls,
            popularity: track.popularity
          })),
          total: searchResponse.data.tracks.total
        },
        artists: searchResponse.data.artists,
        albums: searchResponse.data.albums
      };

      res.status(200).json(transformedData);
    } catch (error: any) {
      console.error('❌ Spotify API error:', error.response?.data || error.message);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        return res.status(401).json({
          error: 'Spotify authentication failed',
          details: 'Invalid or expired credentials'
        });
      }
      
      if (error.response?.status === 429) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          details: 'Too many requests to Spotify API'
        });
      }

      res.status(error.response?.status || 500).json({
        error: 'Failed to fetch from Spotify API',
        details: error.response?.data?.error?.message || error.message
      });
    }
  });
} 