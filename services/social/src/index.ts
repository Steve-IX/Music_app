import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4004;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'social-service',
    timestamp: new Date().toISOString()
  });
});

// Social endpoints (basic structure)
app.get('/social/friends', (req, res) => {
  res.json({ 
    message: 'Friends list - ready for implementation',
    service: 'social-service'
  });
});

app.get('/social/activity', (req, res) => {
  res.json({ 
    message: 'Activity feed - ready for implementation',
    service: 'social-service'
  });
});

app.post('/social/follow/:userId', (req, res) => {
  res.json({ 
    message: `Follow user ${req.params.userId} - ready for implementation`,
    service: 'social-service'
  });
});

app.listen(PORT, () => {
  console.log(`👥 Social Service running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
}); 