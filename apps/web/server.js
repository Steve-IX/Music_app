const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// API Routes
app.use('/api/jamendo', async (req, res) => {
  try {
    const axios = require('axios');
    const { type = 'tracks', query = '', limit = 20 } = req.query;
    const clientId = process.env.VITE_JAMENDO_CLIENT_ID;

    if (!clientId) {
      return res.status(500).json({ error: 'Jamendo API key not configured' });
    }

    const baseUrl = 'https://api.jamendo.com/v3.0';
    let endpoint = '';
    let params = {
      client_id: clientId,
      format: 'json',
      limit: parseInt(limit),
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

    const response = await axios.get(`${baseUrl}${endpoint}`, { params });
    res.json(response.data);
  } catch (error) {
    console.error('Jamendo API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch from Jamendo API',
      details: error.response?.data || error.message
    });
  }
});

app.use('/api/spotify', async (req, res) => {
  try {
    const axios = require('axios');
    const { query = '', limit = 20 } = req.query;
      const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'Spotify credentials not configured' });
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
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        q: query,
        type: 'track,artist,album',
        limit: parseInt(limit),
        market: 'US',
        include_external: 'audio',
      },
    });

    res.json(searchResponse.data);
  } catch (error) {
    console.error('Spotify API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch from Spotify API',
      details: error.response?.data || error.message
    });
  }
});

app.use('/api/youtube', async (req, res) => {
  try {
    const axios = require('axios');
    const { query = '', limit = 20 } = req.query;
    const apiKey = process.env.VITE_YOUTUBE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'YouTube API key not configured' });
    }

    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: `${query} music`,
        type: 'video',
        videoCategoryId: '10', // Music category
        maxResults: parseInt(limit),
        key: apiKey,
        relevanceLanguage: 'en',
        regionCode: 'US',
        videoEmbeddable: 'true',
        videoSyndicated: 'true'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('YouTube API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch from YouTube API',
      details: error.response?.data || error.message
    });
  }
});

// Proxy Vite dev server
if (process.env.NODE_ENV === 'development') {
  app.use('/', createProxyMiddleware({
    target: 'http://localhost:5173',
    changeOrigin: true,
    ws: true,
  }));
} else {
  // Serve static files in production
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API routes available at http://localhost:${PORT}/api/`);
}); 