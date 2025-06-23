import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'auth-service',
    timestamp: new Date().toISOString()
  });
});

// Auth endpoints (basic structure)
app.post('/auth/login', (req, res) => {
  res.json({ 
    message: 'Login endpoint - ready for implementation',
    service: 'auth-service'
  });
});

app.post('/auth/register', (req, res) => {
  res.json({ 
    message: 'Register endpoint - ready for implementation',
    service: 'auth-service'
  });
});

app.listen(PORT, () => {
  console.log(`🔐 Auth Service running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
}); 