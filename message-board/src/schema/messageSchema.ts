import { z } from 'zod';

export const postMessageSchema = z.object({
  topic: z.string().min(1).max(200),
  data: z.string().min(1).max(5000),
  userId: z.string(),
  boardId: z.string(),
});
export type PostMessageSchema = z.infer<typeof postMessageSchema>;

export const messageSchema = z.object({
  id: z.string(),
  topic: z.string().min(1).max(200),
  data: z.string().min(1).max(5000),
  boardId: z.string(),
  userId: z.string(),
  createdAt: z.string(),
});
export type Message = z.infer<typeof messageSchema>;
