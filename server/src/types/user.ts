export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PublicUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: Date;
}

export interface Session {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  user_agent: string | null;
  ip_address: string | null;
}

export interface AuthPayload {
  userId: string;
  sessionId: string;
}
