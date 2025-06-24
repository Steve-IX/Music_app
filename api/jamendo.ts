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
    const { type = 'tracks', query = '', limit = 20 } = req.query;
    const clientId = process.env.JAMENDO_CLIENT_ID || process.env.VITE_JAMENDO_CLIENT_ID;

    if (!clientId) {
      console.log('⚠️ Jamendo API key not configured, returning empty results');
      // Return empty results instead of error when API key is missing
      return res.status(200).json({ 
        results: [],
        headers: { 
          status: 'success',
          code: 0,
          message: 'API key not configured - returning empty results'
        }
      });
    }

    const baseUrl = 'https://api.jamendo.com/v3.0';
    let endpoint = '';
    let params: any = {
      client_id: clientId,
      format: 'json',
      limit: parseInt(limit as string) || 20,
    };

    switch (type) {
      case 'tracks':
        endpoint = '/tracks/';
        params = {
          ...params,
          search: query || 'popular',
          include: 'musicinfo',
          audioformat: 'mp3',
        };
        break;
      case 'artists':
        endpoint = '/artists/';
        params = {
          ...params,
          search: query || 'popular',
        };
        break;
      case 'albums':
        endpoint = '/albums/';
        params = {
          ...params,
          search: query || 'popular',
        };
        break;
      default:
        return res.status(400).json({ error: 'Invalid type parameter' });
    }

    console.log(`🎵 Jamendo API request: ${baseUrl}${endpoint} with query: ${query}`);
    const response = await axios.get(`${baseUrl}${endpoint}`, { 
      params,
      timeout: 8000 // 8 second timeout
    });
    
    console.log(`✅ Jamendo API response: ${response.data.results?.length || 0} results`);
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Jamendo API error:', error.response?.data || error.message);
    
    // Return empty results instead of error for better UX
    res.status(200).json({
      results: [],
      headers: {
        status: 'error',
        code: error.response?.status || 500,
        message: error.response?.data?.message || error.message || 'Jamendo API unavailable'
      }
    });
  }
} 