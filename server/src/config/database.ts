import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const getConnectionConfig = (): mysql.PoolOptions => {
  const baseConfig: mysql.PoolOptions = {
    database: process.env.DB_NAME || 'pbcred',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };

  // Приоритет: сокет > TCP
  if (process.env.DB_SOCKET_PATH) {
    return {
      ...baseConfig,
      socketPath: process.env.DB_SOCKET_PATH,
    };
  }

  // Fallback на TCP подключение
  return {
    ...baseConfig,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
  };
};

export const pool = mysql.createPool(getConnectionConfig());

export const testConnection = async (): Promise<boolean> => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Подключение к MariaDB успешно');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения к MariaDB:', error);
    return false;
  }
};
