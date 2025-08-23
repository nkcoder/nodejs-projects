import { z } from 'zod';

export const websocketConnectionSchema = z.object({
  connectionId: z.string(),
  boardId: z.string().optional(),
  userId: z.string().optional(),
  connectedAt: z.string(),
});
export type WebSocketConnection = z.infer<typeof websocketConnectionSchema>;

export const subscribeMessageSchema = z.object({
  action: z.literal('subscribe'),
  boardId: z.string(),
  userId: z.string().optional(),
});
export type SubscribeMessage = z.infer<typeof subscribeMessageSchema>;

export const unsubscribeMessageSchema = z.object({
  action: z.literal('unsubscribe'),
  boardId: z.string(),
});
export type UnsubscribeMessage = z.infer<typeof unsubscribeMessageSchema>;

export const websocketMessageSchema = z.union([subscribeMessageSchema, unsubscribeMessageSchema]);
export type WebSocketMessage = z.infer<typeof websocketMessageSchema>;

export const broadcastMessageSchema = z.object({
  type: z.literal('message'),
  boardId: z.string(),
  message: z.object({
    id: z.string(),
    topic: z.string(),
    data: z.string(),
    boardId: z.string(),
    userId: z.string(),
    createdAt: z.string(),
  }),
});
export type BroadcastMessage = z.infer<typeof broadcastMessageSchema>;
