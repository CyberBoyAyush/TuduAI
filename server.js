// Local development server to handle API requests
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import parseTaskHandler from './api/parse-task.js';
import nodemailer from 'nodemailer';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

async function createServer() {
  const app = express();
  const PORT = process.env.PORT || 3001;

  // Enable CORS for all routes
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'https://tuduai.vercel.app'],
    credentials: true
  }));
  
  // Parse JSON request body first
  app.use(bodyParser.json());
  
  // API routes
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
  
  // Create Zoho transporter
  const createZohoTransporter = () => {
    return nodemailer.createTransport({
      host: process.env.VITE_ZOHO_SMTP_HOST || 'smtp.zoho.com',
      port: parseInt(process.env.VITE_ZOHO_SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.VITE_ZOHO_SMTP_USER,
        pass: process.env.VITE_ZOHO_SMTP_PASSWORD?.replace(/['"]/g, '') // Remove quotes
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  };

  // Email sending endpoint
  app.post('/api/send-email', async (req, res) => {
    try {
      const { to, subject, html, text } = req.body;

      if (!to || !subject || (!html && !text)) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: to, subject, and content (html or text)'
        });
      }

      console.log('Attempting to send email to:', to);
      console.log('Using SMTP config:', {
        host: process.env.VITE_ZOHO_SMTP_HOST,
        port: process.env.VITE_ZOHO_SMTP_PORT,
        user: process.env.VITE_ZOHO_SMTP_USER
      });

      const transporter = createZohoTransporter();

      // Verify connection
      try {
        await transporter.verify();
        console.log('SMTP connection verified successfully');
      } catch (verifyError) {
        console.error('SMTP verification failed:', verifyError);
        throw new Error('SMTP configuration error: ' + verifyError.message);
      }

      const mailOptions = {
        from: process.env.VITE_ZOHO_FROM_EMAIL || `"TuduAI" <${process.env.VITE_ZOHO_SMTP_USER}>`,
        to,
        subject,
        html,
        text
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);

      res.json({
        success: true,
        messageId: info.messageId,
        message: 'Email sent successfully'
      });

    } catch (error) {
      console.error('Email sending error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to send email',
        error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
      });
    }
  });
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      env: {
        smtp_host: process.env.VITE_ZOHO_SMTP_HOST,
        smtp_port: process.env.VITE_ZOHO_SMTP_PORT,
        smtp_user: process.env.VITE_ZOHO_SMTP_USER ? 'configured' : 'missing'
      }
    });
  });
  
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
  app.listen(PORT, () => {
    console.log(`API Server running at http://localhost:${PORT}`);
    console.log(`API endpoint available at http://localhost:${PORT}/api/parse-task`);
    console.log(`Email endpoint available at http://localhost:${PORT}/api/send-email`);
    console.log(`Press Ctrl+C to stop`);
  });
}

createServer().catch((err) => {
  console.error('Error starting server:', err);
});