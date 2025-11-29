import bcrypt from 'bcrypt';
import { usersRepository } from './users.repository.js';
import type {
  UpdateProfileInput,
  ChangePasswordInput,
  PublicUserResponse,
  UserProfileResponse,
  UsersListResponse,
  GroupResponse,
} from './users.types.js';

const SALT_ROUNDS = 12;

export class UsersError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'UsersError';
  }
}

export const usersService = {
  /**
   * Get user profile by ID
   */
  async getProfile(userId: string, requesterId?: string): Promise<UserProfileResponse> {
    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new UsersError('User not found', 404);
    }

    const isOwner = requesterId === userId;
    const groups = await usersRepository.getUserGroups(userId);

    const response: UserProfileResponse = {
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        bio: user.bio,
        created_at: user.created_at,
        groups,
      },
      isOwner,
    };

    // Include email for profile owner
    if (isOwner) {
      const fullUser = await usersRepository.findByIdWithEmail(userId);
      if (fullUser) {
        response.user.email = fullUser.email;
      }
    }

    return response;
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateProfileInput): Promise<PublicUserResponse> {
    if (Object.keys(data).length === 0) {
      throw new UsersError('No data to update', 400);
    }

    await usersRepository.updateProfile(userId, data);

    const user = await usersRepository.findByIdWithEmail(userId);
    if (!user) {
      throw new UsersError('User not found', 404);
    }

    const groups = await usersRepository.getUserGroups(userId);

    return {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      bio: user.bio,
      created_at: user.created_at,
      groups,
    };
  },

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    sessionId: string,
    data: ChangePasswordInput
  ): Promise<void> {
    const user = await usersRepository.findByIdWithPassword(userId);
    if (!user) {
      throw new UsersError('User not found', 404);
    }

    // Verify current password
    const validPassword = await bcrypt.compare(data.current_password, user.password_hash);
    if (!validPassword) {
      throw new UsersError('Invalid current password', 400);
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(data.new_password, SALT_ROUNDS);
    await usersRepository.updatePassword(userId, newPasswordHash);

    // Delete all sessions except current
    await usersRepository.deleteOtherSessions(userId, sessionId);
  },

  /**
   * Get users list with pagination
   */
  async getUsers(options: {
    sort?: string;
    order?: string;
    limit?: number;
    offset?: number;
  }): Promise<UsersListResponse> {
    // Validate sort field
    const allowedSortFields = ['created_at', 'username', 'display_name'];
    const sortField = allowedSortFields.includes(options.sort || '') 
      ? options.sort! 
      : 'created_at';
    const sortOrder = options.order?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const limit = Math.min(Math.max(options.limit || 50, 1), 100);
    const offset = Math.max(options.offset || 0, 0);

    const [total, users] = await Promise.all([
      usersRepository.getTotalCount(),
      usersRepository.getUsers({ sortField, sortOrder, limit, offset }),
    ]);

    // Get groups for each user
    const usersWithGroups = await Promise.all(
      users.map(async (user) => {
        const groups = await usersRepository.getUserGroups(user.id);
        return {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          avatar_url: user.avatar_url,
          bio: user.bio,
          created_at: user.created_at,
          groups,
        };
      })
    );

    return {
      users: usersWithGroups,
      pagination: { total, limit, offset },
    };
  },

  /**
   * Get all available groups
   */
  async getGroups(): Promise<GroupResponse[]> {
    return usersRepository.getAllGroups();
  },

  /**
   * Update user groups (admin only)
   */
  async updateUserGroups(
    targetUserId: string,
    groups: string[],
    adminId: string
  ): Promise<string[]> {
    // Check if target user exists
    const exists = await usersRepository.exists(targetUserId);
    if (!exists) {
      throw new UsersError('User not found', 404);
    }

    if (groups.length === 0) {
      throw new UsersError('User must belong to at least one group', 400);
    }

    const uniqueGroups = Array.from(new Set(groups));
    if (uniqueGroups.length !== 1) {
      throw new UsersError('User can belong to only one group', 400);
    }

    if (targetUserId === adminId) {
      throw new UsersError('Administrators cannot change their own groups', 400);
    }

    const targetGroup = uniqueGroups[0];

    // Get valid group IDs for the target group
    const validGroups = await usersRepository.getGroupsByNames([targetGroup]);
    const validGroupMap = new Map(validGroups.map((g) => [g.name, g.id]));

    // Remove all current group memberships
    await usersRepository.removeAllGroupMemberships(targetUserId);

    const groupId = validGroupMap.get(targetGroup);
    if (groupId) {
      await usersRepository.addUserToGroup(targetUserId, groupId, adminId);
    }

    // Return updated groups
    return usersRepository.getUserGroups(targetUserId);
  },

  /**
   * Check if user is administrator
   */
  async isAdmin(userId: string): Promise<boolean> {
    const rights = await usersRepository.getUserRights(userId);
    return rights.includes('*') || rights.includes('manage_users') || rights.includes('view_admin_panel');
  },
};
