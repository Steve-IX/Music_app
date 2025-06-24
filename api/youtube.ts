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
    const apiKey = process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'YouTube API key not configured' });
    }

    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: `${query} music`,
        type: 'video',
        videoCategoryId: '10', // Music category
        maxResults: parseInt(limit as string),
        key: apiKey,
        relevanceLanguage: 'en',
        regionCode: 'US',
        videoEmbeddable: 'true',
        videoSyndicated: 'true'
      }
    });

    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('YouTube API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch from YouTube API',
      details: error.response?.data || error.message
    });
  }
} 