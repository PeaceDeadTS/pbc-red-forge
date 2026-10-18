import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseName = process.env.DB_NAME;
const databaseUser = process.env.DB_USER;
const databasePassword = process.env.DB_PASSWORD;

if (!databaseName || !databaseUser || databasePassword === undefined) {
  throw new Error('DB_NAME, DB_USER and DB_PASSWORD must be set. An empty DB_PASSWORD is allowed only when the variable is present.');
}

const getConnectionConfig = (): mysql.PoolOptions => {
  const baseConfig: mysql.PoolOptions = {
    database: databaseName,
    user: databaseUser,
    password: databasePassword,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };

  // Priority: socket > TCP
  if (process.env.DB_SOCKET_PATH) {
    return {
      ...baseConfig,
      socketPath: process.env.DB_SOCKET_PATH,
    };
  }

  // Fallback to TCP connection
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
    console.log('✅ Database connection successful');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    return false;
  }
};
