import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';

// Shared infrastructure
import { testConnection, ensureSchema } from './shared/index.js';

// Feature modules
import { authRoutes } from './modules/auth/index.js';
import { usersRoutes } from './modules/users/index.js';
import { articlesRoutes } from './modules/articles/index.js';
import { tagsRoutes } from './modules/tags/index.js';
import { reactionsRoutes } from './modules/reactions/index.js';
import { generationRoutes } from './modules/generation/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const SOCKET_PATH = process.env.API_SOCKET_PATH;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Trust proxy for correct IP detection
app.set('trust proxy', 1);

// Routes - Feature modules
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/articles', articlesRoutes);
app.use('/api/v1/tags', tagsRoutes);
app.use('/api/v1/reactions', reactionsRoutes);
app.use('/api/v1/generation', generationRoutes);

// Health check
app.get('/api/v1/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const start = async () => {
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('❌ Database connection failed. Server not started.');
    process.exit(1);
  }

  try {
    await ensureSchema();
    console.log('✅ Database schema verified/initialized');
  } catch (error) {
    console.error('❌ Database schema initialization error:', error);
    process.exit(1);
  }

  if (SOCKET_PATH) {
    if (fs.existsSync(SOCKET_PATH)) {
      fs.unlinkSync(SOCKET_PATH);
    }

    const server = app.listen(SOCKET_PATH, () => {
      console.log(`🚀 API server running on Unix socket ${SOCKET_PATH}`);
    });

    // Set socket permissions for nginx (www-data)
    fs.chmodSync(SOCKET_PATH, 0o660);

    return server;
  }

  app.listen(PORT, () => {
    console.log(`🚀 API server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
  });
};

start();
