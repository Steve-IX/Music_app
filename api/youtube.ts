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
      console.log('⚠️ YouTube API key not configured, returning empty results');
      // Return empty results instead of error when API key is missing
      return res.status(200).json({ 
        items: [],
        pageInfo: {
          totalResults: 0,
          resultsPerPage: 0
        },
        kind: 'youtube#searchListResponse'
      });
    }

    console.log(`🎵 YouTube API request with query: ${query}`);
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: `${query} music`,
        type: 'video',
        videoCategoryId: '10', // Music category
        maxResults: parseInt(limit as string) || 20,
        key: apiKey,
        relevanceLanguage: 'en',
        regionCode: 'US',
        videoEmbeddable: 'true',
        videoSyndicated: 'true'
      },
      timeout: 8000 // 8 second timeout
    });

    console.log(`✅ YouTube API response: ${response.data.items?.length || 0} results`);
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('YouTube API error:', error.response?.data || error.message);
    
    // Return empty results instead of error for better UX
    res.status(200).json({
      items: [],
      pageInfo: {
        totalResults: 0,
        resultsPerPage: 0
      },
      kind: 'youtube#searchListResponse',
      error: {
        code: error.response?.status || 500,
        message: error.response?.data?.error?.message || error.message || 'YouTube API unavailable'
      }
    });
  }
} 