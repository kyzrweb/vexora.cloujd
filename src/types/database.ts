export type UserStatus = "online" | "idle" | "dnd" | "offline";
export type RoomType = "voice" | "watch_party";
export type InviteStatus = "pending" | "accepted" | "declined";
export type FriendshipStatus = "pending" | "accepted" | "blocked";
export type ReportStatus = "open" | "resolved" | "dismissed";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  status: UserStatus;
  current_game: string | null;
  is_banned: boolean;
  ban_reason: string | null;
  updated_at: string;
  created_at: string;
}

export interface Room {
  id: string;
  code: string;
  title: string;
  type: RoomType;
  category: string;
  stream_url: string | null;
  owner_id: string;
  is_private: boolean;
  created_at: string;
  owner?: Profile;
}

export interface RoomInvite {
  id: string;
  room_id: string;
  sender_id: string;
  receiver_id: string;
  status: InviteStatus;
  created_at: string;
  room?: Room;
  sender?: Profile;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: FriendshipStatus;
  created_at: string;
  user?: Profile;
  friend?: Profile;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface RoomMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export interface DirectionReport {
  id: string;
  reporter_id: string | null;
  target_user_id: string | null;
  room_id: string | null;
  reason: string;
  status: ReportStatus;
  handled_by: string | null;
  created_at: string;
}
