import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4003;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'stream-service',
    timestamp: new Date().toISOString()
  });
});

// Streaming endpoints (basic structure)
app.get('/stream/:trackId', (req, res) => {
  res.json({ 
    message: `Stream track ${req.params.trackId} - ready for implementation`,
    service: 'stream-service'
  });
});

app.get('/stream/hls/:trackId/playlist.m3u8', (req, res) => {
  res.json({ 
    message: `HLS playlist for track ${req.params.trackId} - ready for implementation`,
    service: 'stream-service'
  });
});

app.listen(PORT, () => {
  console.log(`🎵 Stream Service running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
}); 