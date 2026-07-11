import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

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
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Make io available in routes
app.set('io', io);

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

// Socket connection
io.on('connection', (socket) => {
  console.log('Client connected for real-time updates:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ message: err.message || 'Something went wrong on the server' });
});

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

export default app;
