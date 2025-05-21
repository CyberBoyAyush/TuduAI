// Local development server to handle API requests
import express from 'express';
import { createServer as createViteServer } from 'vite';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import parseTaskHandler from './api/parse-task.js';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

async function createServer() {
  const app = express();
  
  // Enable CORS for all routes
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });
  
  // Parse JSON request body first
  app.use(bodyParser.json());
  
  // API routes - register before Vite middleware
  app.post('/api/parse-task', async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }
      
      // Call the handler with request and response
      await parseTaskHandler(req, res);
    } catch (error) {
      console.error('Error handling API request:', error);
      res.status(500).json({
        error: 'Server error',
        message: error.message
      });
    }
  });
  
  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  
  // Use Vite's connect instance as middleware AFTER API routes
  app.use(vite.middlewares);
  
  // Serve static assets in production
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    
    // All other routes - send to index.html (for SPA)
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
  
  // Start the server
  const port = process.env.PORT || 5173;
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`API endpoint available at http://localhost:${port}/api/parse-task`);
    console.log(`Press Ctrl+C to stop`);
  });
}

createServer().catch((err) => {
  console.error('Error starting server:', err);
}); 