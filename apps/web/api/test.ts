import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const testData = {
      status: 'success',
      message: 'API route is working',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent'],
        'accept': req.headers['accept']
      }
    };

    res.status(200).json(testData);
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'API route error',
      details: error.message
    });
  }
} 