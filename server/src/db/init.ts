import { pool, testConnection, ensureSchema } from '../shared/index.js';

const initDatabase = async () => {
  console.log('🔄 Initializing database...');

  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }

  try {
    await ensureSchema();
    console.log('🎉 Database initialized successfully!');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    process.exit(1);
  }

  await pool.end();
};

initDatabase();
