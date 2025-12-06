// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from repo root (../../.. from this file)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import completeRouter from './routes/complete.js';
import gatesRouter from './routes/gates.js';
import keysRouter from './routes/keys.js';
import authRouter from './routes/auth.js';
import analyticsRouter from './routes/logs.js'; 

const app = express()
const PORT = process.env.PORT || 3001; 

// Request logger middleware
const requestLogger = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  // Log request
  console.log(`\n[${timestamp}] ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    const fieldNames = Object.keys(req.body).join(', ');
    console.log(`Body fields: ${fieldNames}`);
  }

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${timestamp}] ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`);
  });

  next();
};

// Middleware 
app.use(helmet())
app.use(cors())
app.use(express.json())

// Enable request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use(requestLogger);
}

// health check route
app.get('/health', (req, res) => {
  res.json({status: 'ok', message: 'Layer API is running'}); 
})

// Routes
app.use('/v1/complete', completeRouter);
app.use('/v1/gates', gatesRouter);
app.use('/v1/keys', keysRouter);
app.use('/auth', authRouter);
app.use('/v1/logs', analyticsRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Layer API is running on port ${PORT}`); 
})