import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

import settingsRoutes from './routes/settingsRoutes.js';
import repoRoutes from './routes/repoRoutes.js';
import prRoutes from './routes/prRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { seedMemoryDb } from './config/memoryDb.js';

// Load env variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Seed memory database in case MongoDB fails and we fallback
seedMemoryDb();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/settings', settingsRoutes);
app.use('/api/repos', repoRoutes);
app.use('/api/prs', prRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ message: err.message || 'Something went wrong on the server' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
