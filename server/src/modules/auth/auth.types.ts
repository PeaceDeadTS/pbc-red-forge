import { z } from 'zod';

// Validation schemas
export const registerSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and _'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
  display_name: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  login: z.string().min(1, 'Enter login or email'),
  password: z.string().min(1, 'Enter password'),
  remember_me: z.boolean().optional().default(false),
});

// Types inferred from schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// Response types
export interface AuthUserResponse {
  id: string;
  username: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  groups: string[];
}

export interface AuthResponse {
  message: string;
  token: string;
  user: AuthUserResponse;
}

export interface MeResponse {
  user: AuthUserResponse & { created_at: Date };
}
