import { z } from 'zod';

// Validation schemas
export const updateProfileSchema = z.object({
  display_name: z.string().max(100).optional(),
  bio: z.string().max(1000).optional(),
  avatar_url: z.string().url().max(500).optional().nullable(),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8),
});

export const updateUserGroupsSchema = z.object({
  groups: z.array(z.string()).min(1).max(1),
});

// Types inferred from schemas
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateUserGroupsInput = z.infer<typeof updateUserGroupsSchema>;

// Response types
export interface PublicUserResponse {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: Date;
  groups: string[];
}

export interface UserProfileResponse {
  user: PublicUserResponse & { email?: string };
  isOwner: boolean;
}

export interface UsersListResponse {
  users: PublicUserResponse[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface GroupResponse {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
}
