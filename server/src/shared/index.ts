// Database
export { pool, testConnection, ensureSchema } from './database/index.js';

// Config
export { jwtConfig } from './config/index.js';
export type { JwtConfig } from './config/index.js';

// Middleware
export { authMiddleware, optionalAuthMiddleware } from './middleware/index.js';
export type { AuthRequest, AuthPayload } from './middleware/index.js';

// Utils
export { parseExpiration } from './utils/index.js';
