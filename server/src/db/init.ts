import { pool, testConnection } from '../config/database.js';
import { ensureSchema } from './schema.js';

const initDatabase = async () => {
  console.log('🔄 Инициализация базы данных...');

  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }

  try {
    await ensureSchema();
    console.log('🎉 База данных успешно инициализирована!');
  } catch (error) {
    console.error('❌ Ошибка инициализации БД:', error);
    process.exit(1);
  }

  await pool.end();
};

initDatabase();
