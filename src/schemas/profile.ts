import { z } from 'zod';

export const profileSchema = z.object({
  id: z.string(),
  email: z.string().email().nullable(),
  username: z.string().nullable(),
  avatar_url: z.string().nullable(),
  created_at: z.string().nullable(),
});

export type Profile = z.infer<typeof profileSchema>;

export const updateProfileSchema = profileSchema.partial().required({ id: true });
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
