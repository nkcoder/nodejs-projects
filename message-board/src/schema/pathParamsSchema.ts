import { z } from 'zod';

export const emailParamSchema = z.object({
  email: z.email(),
});
export type EmailParamSchema = z.infer<typeof emailParamSchema>;

export const boardIdParamSchema = z.object({
  boardId: z
    .string()
    .min(1)
    .refine(s => s.trim().length > 0, {
      message: 'Board ID cannot be empty or whitespace only',
    }),
});
export type BoardIdParamSchema = z.infer<typeof boardIdParamSchema>;

/**
 * Validate email parameter from path
 */
export function validateEmailParam(email: string): string {
  try {
    const result = emailParamSchema.parse({ email });
    return result.email;
  } catch {
    throw new Error('Invalid email format');
  }
}

/**
 * Validate board ID parameter from path
 */
export function validateBoardIdParam(boardId: string): string {
  try {
    const result = boardIdParamSchema.parse({ boardId });
    return result.boardId;
  } catch {
    throw new Error('Invalid board ID format');
  }
}
