import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import { testConnection } from './config/database.js';
import { ensureSchema } from './db/schema.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';

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

  try {
    await ensureSchema();
    console.log('✅ Схема базы данных проверена/инициализирована');
  } catch (error) {
    console.error('❌ Ошибка инициализации схемы БД:', error);
    process.exit(1);
  }

  if (SOCKET_PATH) {
    if (fs.existsSync(SOCKET_PATH)) {
      fs.unlinkSync(SOCKET_PATH);
    }

    const server = app.listen(SOCKET_PATH, () => {
      console.log(`🚀 API сервер запущен на Unix-сокете ${SOCKET_PATH}`);
    });

    // Обеспечиваем права доступа к сокету для nginx (www-data)
    fs.chmodSync(SOCKET_PATH, 0o660);

    return server;
  }

  app.listen(PORT, () => {
    console.log(`🚀 API сервер запущен на порту ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
  });
};

start();
