import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4002;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'library-service',
    timestamp: new Date().toISOString()
  });
});

// Library endpoints (basic structure)
app.get('/library/artists', (req, res) => {
  res.json({ 
    message: 'Artists endpoint - ready for implementation',
    service: 'library-service'
  });
});

app.get('/library/albums', (req, res) => {
  res.json({ 
    message: 'Albums endpoint - ready for implementation',
    service: 'library-service'
  });
});

app.get('/library/tracks', (req, res) => {
  res.json({ 
    message: 'Tracks endpoint - ready for implementation',
    service: 'library-service'
  });
});

app.listen(PORT, () => {
  console.log(`📚 Library Service running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
}); 