import { z } from 'zod';

export const createBoardSchema = z.object({
  name: z.string().min(2).max(100),
  createdBy: z.string(),
});
export type CreateBoardSchema = z.infer<typeof createBoardSchema>;

export const boardSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(100),
  createdBy: z.string(),
  createdAt: z.string(),
});
export type Board = z.infer<typeof boardSchema>;
