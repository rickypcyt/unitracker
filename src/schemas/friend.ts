import { z } from 'zod';

export const friendRequestStatusSchema = z.enum(['pending', 'accepted', 'rejected']);
export type FriendRequestStatus = z.infer<typeof friendRequestStatusSchema>;

export const friendRequestSchema = z.object({
  id: z.string(),
  from_user_id: z.string(),
  to_user_id: z.string(),
  status: friendRequestStatusSchema,
  from_user: z.object({
    username: z.string().nullable().optional(),
    avatar_url: z.string().nullable().optional(),
  }).nullable().optional(),
  to_user: z.object({
    username: z.string().nullable().optional(),
    avatar_url: z.string().nullable().optional(),
  }).nullable().optional(),
});

export type FriendRequest = z.infer<typeof friendRequestSchema>;

export const friendProfileSchema = z.object({
  id: z.string(),
  username: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  friendship_id: z.string().optional(),
  added_at: z.string().nullable().optional(),
});

export type FriendProfile = z.infer<typeof friendProfileSchema>;

export const createFriendRequestSchema = z.object({
  to_user_id: z.string().min(1, 'Target user ID is required'),
});

export type CreateFriendRequestInput = z.infer<typeof createFriendRequestSchema>;
