import { z } from 'zod';

export const registerUserSchema = z.object({
  email: z.email(),
  name: z.string().min(2).max(30),
});
export type RegisterUserSchema = z.infer<typeof registerUserSchema>;

export const userSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().min(2).max(30),
  createdAt: z.iso.datetime(),
});
export type User = z.infer<typeof userSchema>;

export const getUserByEmailSchema = z.object({
  email: z.email(),
});
export type GetUserByEmail = z.infer<typeof getUserByEmailSchema>;
