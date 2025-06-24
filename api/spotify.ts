import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query = '', limit = 20 } = req.query;
    const clientId = process.env.SPOTIFY_CLIENT_ID || process.env.VITE_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || process.env.VITE_SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.log('⚠️ Spotify credentials not configured, returning empty results');
      // Return empty results instead of error when credentials are missing
      return res.status(200).json({ 
        tracks: { items: [] },
        artists: { items: [] },
        albums: { items: [] },
        error: {
          status: 'credentials_missing',
          message: 'Spotify API credentials not configured'
        }
      });
    }

    console.log(`🎵 Spotify API request with query: ${query}`);

    // Get access token
    const tokenResponse = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        timeout: 8000
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Make search request
    const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        q: query,
        type: 'track,artist,album',
        limit: parseInt(limit as string) || 20,
        market: 'US',
        include_external: 'audio',
      },
      timeout: 8000
    });

    console.log(`✅ Spotify API response: ${searchResponse.data.tracks?.items?.length || 0} tracks, ${searchResponse.data.artists?.items?.length || 0} artists, ${searchResponse.data.albums?.items?.length || 0} albums`);
    res.status(200).json(searchResponse.data);
  } catch (error: any) {
    console.error('Spotify API error:', error.response?.data || error.message);
    
    // Return empty results instead of error for better UX
    res.status(200).json({
      tracks: { items: [] },
      artists: { items: [] },
      albums: { items: [] },
      error: {
        status: error.response?.status || 500,
        message: error.response?.data?.error?.message || error.message || 'Spotify API unavailable'
      }
    });
  }
} 