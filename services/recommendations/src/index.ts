import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4005;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'recommendations-service',
    timestamp: new Date().toISOString()
  });
});

// Recommendations endpoints (basic structure)
app.get('/recommendations/for-you', (req, res) => {
  res.json({ 
    message: 'For You recommendations - ready for implementation',
    service: 'recommendations-service'
  });
});

app.get('/recommendations/similar/:trackId', (req, res) => {
  res.json({ 
    message: `Similar tracks to ${req.params.trackId} - ready for implementation`,
    service: 'recommendations-service'
  });
});

app.listen(PORT, () => {
  console.log(`🤖 Recommendations Service running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
}); 