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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, redirect_uri } = req.body;
    const clientId = process.env.VITE_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.VITE_SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'Spotify credentials not configured' });
    }

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Exchange authorization code for tokens
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirect_uri || 'https://music-app-eta-vert.vercel.app/spotify-callback'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        }
      }
    );

    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Spotify auth error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to exchange authorization code',
      details: error.response?.data || error.message
    });
  }
} 