import { VercelRequest, VercelResponse } from '@vercel/node';

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
    const debug = {
      // Check if environment variables exist (without exposing the actual values)
      spotify_client_id: process.env.SPOTIFY_CLIENT_ID ? '✅ Set' : '❌ Missing',
      spotify_client_secret: process.env.SPOTIFY_CLIENT_SECRET ? '✅ Set' : '❌ Missing',
      youtube_api_key: process.env.YOUTUBE_API_KEY ? '✅ Set' : '❌ Missing',
      jamendo_client_id: process.env.JAMENDO_CLIENT_ID ? '✅ Set' : '❌ Missing',
      
      // Check client-side variables (these should be undefined in server-side)
      vite_spotify_client_id: process.env.VITE_SPOTIFY_CLIENT_ID ? '⚠️ Present (should not be)' : '✅ Correctly absent',
      vite_youtube_api_key: process.env.VITE_YOUTUBE_API_KEY ? '⚠️ Present (should not be)' : '✅ Correctly absent',
      vite_jamendo_client_id: process.env.VITE_JAMENDO_CLIENT_ID ? '⚠️ Present (should not be)' : '✅ Correctly absent',
      
      // Environment info
      node_env: process.env.NODE_ENV || 'undefined',
      vercel_env: process.env.VERCEL_ENV || 'undefined',
      
      // Test API calls
      timestamp: new Date().toISOString(),
      deployment_url: process.env.VERCEL_URL || 'localhost'
    };

    res.status(200).json(debug);
  } catch (error: any) {
    res.status(500).json({
      error: 'Debug endpoint error',
      details: error.message
    });
  }
} 