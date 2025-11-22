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
import analyticsRouter from './routes/analytics.js'; 

const app = express()
const PORT = process.env.PORT || 3001; 

// Middleware 
app.use(helmet())
app.use(cors())
app.use(express.json())

// health check route
app.get('/health', (req, res) => {
  res.json({status: 'ok', message: 'Layer API is running'}); 
})

// Routes
app.use('/v1/complete', completeRouter);
app.use('/v1/gates', gatesRouter);
app.use('/v1/keys', keysRouter);
app.use('/api/auth', authRouter);
app.use('/api/analytics', analyticsRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Layer API is running on port ${PORT}`); 
})