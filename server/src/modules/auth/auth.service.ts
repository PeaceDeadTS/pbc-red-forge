import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { jwtConfig, parseExpiration } from '../../shared/index.js';
import { authRepository } from './auth.repository.js';
import type { RegisterInput, LoginInput, AuthUserResponse } from './auth.types.js';

const SALT_ROUNDS = 12;

export interface RegisterResult {
  token: string;
  user: AuthUserResponse;
}

export interface LoginResult {
  token: string;
  user: AuthUserResponse;
}

export const authService = {
  /**
   * Register new user
   */
  async register(
    data: RegisterInput,
    meta: { userAgent: string | null; ipAddress: string | null }
  ): Promise<RegisterResult> {
    // Check if username or email already exists
    const exists = await authRepository.existsByUsernameOrEmail(data.username, data.email);
    if (exists) {
      throw new AuthError('User with this username or email already exists', 400);
    }

    // Check if this is the first user (will become administrator)
    const userCount = await authRepository.getUserCount();
    const isFirstUser = userCount === 0;

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const userId = uuidv4();

    // Create user
    await authRepository.createUser({
      id: userId,
      username: data.username,
      email: data.email,
      passwordHash,
      displayName: data.display_name || data.username,
    });

    // Assign user to groups
    if (isFirstUser) {
      await this.assignToGroup(userId, 'administrator');
    } else {
      await this.assignToGroup(userId, 'user');
    }

    // Get assigned groups
    const groups = await authRepository.getUserGroups(userId);

    // Create session
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day

    const token = jwt.sign(
      { userId, sessionId },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await authRepository.createSession({
      id: sessionId,
      userId,
      tokenHash,
      expiresAt,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    });

    return {
      token,
      user: {
        id: userId,
        username: data.username,
        email: data.email,
        display_name: data.display_name || data.username,
        avatar_url: null,
        bio: null,
        groups,
      },
    };
  },

  /**
   * Login user
   */
  async login(
    data: LoginInput,
    meta: { userAgent: string | null; ipAddress: string | null }
  ): Promise<LoginResult> {
    // Find user by username or email
    const user = await authRepository.findByUsernameOrEmail(data.login);
    if (!user) {
      throw new AuthError('Invalid login or password', 401);
    }

    // Verify password
    const validPassword = await bcrypt.compare(data.password, user.password_hash);
    if (!validPassword) {
      throw new AuthError('Invalid login or password', 401);
    }

    // Create session
    const sessionId = uuidv4();
    const expiresIn = data.remember_me ? jwtConfig.rememberExpiresIn : jwtConfig.expiresIn;
    const expiresMs = parseExpiration(expiresIn);
    const expiresAt = new Date(Date.now() + expiresMs);

    const token = jwt.sign(
      { userId: user.id, sessionId },
      jwtConfig.secret,
      { expiresIn }
    );

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await authRepository.createSession({
      id: sessionId,
      userId: user.id,
      tokenHash,
      expiresAt,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    });

    // Get user groups
    const groups = await authRepository.getUserGroups(user.id);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        bio: user.bio,
        groups,
      },
    };
  },

  /**
   * Logout - delete current session
   */
  async logout(sessionId: string): Promise<void> {
    await authRepository.deleteSession(sessionId);
  },

  /**
   * Logout from all devices - delete all user sessions
   */
  async logoutAll(userId: string): Promise<void> {
    await authRepository.deleteAllUserSessions(userId);
  },

  /**
   * Get current user data
   */
  async getCurrentUser(userId: string): Promise<AuthUserResponse & { created_at: Date }> {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw new AuthError('User not found', 404);
    }

    const groups = await authRepository.getUserGroups(userId);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      bio: user.bio,
      created_at: user.created_at,
      groups,
    };
  },

  /**
   * Helper: assign user to group by name
   */
  async assignToGroup(userId: string, groupName: string, assignedBy?: string): Promise<void> {
    const group = await authRepository.getGroupByName(groupName);
    if (group) {
      await authRepository.assignUserToGroup(userId, group.id, assignedBy);
    }
  },
};

/**
 * Custom error class for auth errors
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
