import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Trust proxy для корректного определения IP
app.set('trust proxy', 1);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Запуск сервера
const start = async () => {
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('❌ Не удалось подключиться к базе данных. Сервер не запущен.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 API сервер запущен на порту ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
  });
};

start();
