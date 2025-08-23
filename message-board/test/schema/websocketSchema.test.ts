// test/schema/websocketSchema.test.ts
import { describe, expect, it } from 'vitest';
import {
  websocketConnectionSchema,
  subscribeMessageSchema,
  unsubscribeMessageSchema,
  websocketMessageSchema,
  broadcastMessageSchema,
} from '../../src/schema/websocketSchema';

describe('websocketSchema', () => {
  describe('websocketConnectionSchema', () => {
    it('should validate a valid WebSocket connection', () => {
      const validConnection = {
        connectionId: 'test-connection-id',
        boardId: 'test-board-id',
        userId: 'test-user-id',
        connectedAt: '2023-01-01T00:00:00.000Z',
      };

      const result = websocketConnectionSchema.parse(validConnection);
      expect(result).toEqual(validConnection);
    });

    it('should validate connection without optional fields', () => {
      const validConnection = {
        connectionId: 'test-connection-id',
        connectedAt: '2023-01-01T00:00:00.000Z',
      };

      const result = websocketConnectionSchema.parse(validConnection);
      expect(result).toEqual(validConnection);
    });

    it('should reject connection without required fields', () => {
      const invalidConnection = {
        boardId: 'test-board-id',
        userId: 'test-user-id',
        connectedAt: '2023-01-01T00:00:00.000Z',
      };

      expect(() => websocketConnectionSchema.parse(invalidConnection)).toThrow();
    });
  });

  describe('subscribeMessageSchema', () => {
    it('should validate a valid subscribe message', () => {
      const validMessage = {
        action: 'subscribe' as const,
        boardId: 'test-board-id',
        userId: 'test-user-id',
      };

      const result = subscribeMessageSchema.parse(validMessage);
      expect(result).toEqual(validMessage);
    });

    it('should validate subscribe message without optional userId', () => {
      const validMessage = {
        action: 'subscribe' as const,
        boardId: 'test-board-id',
      };

      const result = subscribeMessageSchema.parse(validMessage);
      expect(result).toEqual(validMessage);
    });

    it('should reject subscribe message with wrong action', () => {
      const invalidMessage = {
        action: 'unsubscribe',
        boardId: 'test-board-id',
      };

      expect(() => subscribeMessageSchema.parse(invalidMessage)).toThrow();
    });

    it('should reject subscribe message without boardId', () => {
      const invalidMessage = {
        action: 'subscribe',
        userId: 'test-user-id',
      };

      expect(() => subscribeMessageSchema.parse(invalidMessage)).toThrow();
    });
  });

  describe('unsubscribeMessageSchema', () => {
    it('should validate a valid unsubscribe message', () => {
      const validMessage = {
        action: 'unsubscribe' as const,
        boardId: 'test-board-id',
      };

      const result = unsubscribeMessageSchema.parse(validMessage);
      expect(result).toEqual(validMessage);
    });

    it('should reject unsubscribe message with wrong action', () => {
      const invalidMessage = {
        action: 'subscribe',
        boardId: 'test-board-id',
      };

      expect(() => unsubscribeMessageSchema.parse(invalidMessage)).toThrow();
    });

    it('should reject unsubscribe message without boardId', () => {
      const invalidMessage = {
        action: 'unsubscribe',
      };

      expect(() => unsubscribeMessageSchema.parse(invalidMessage)).toThrow();
    });
  });

  describe('websocketMessageSchema', () => {
    it('should validate subscribe message', () => {
      const subscribeMessage = {
        action: 'subscribe' as const,
        boardId: 'test-board-id',
        userId: 'test-user-id',
      };

      const result = websocketMessageSchema.parse(subscribeMessage);
      expect(result).toEqual(subscribeMessage);
    });

    it('should validate unsubscribe message', () => {
      const unsubscribeMessage = {
        action: 'unsubscribe' as const,
        boardId: 'test-board-id',
      };

      const result = websocketMessageSchema.parse(unsubscribeMessage);
      expect(result).toEqual(unsubscribeMessage);
    });

    it('should reject invalid action', () => {
      const invalidMessage = {
        action: 'invalid-action',
        boardId: 'test-board-id',
      };

      expect(() => websocketMessageSchema.parse(invalidMessage)).toThrow();
    });
  });

  describe('broadcastMessageSchema', () => {
    it('should validate a valid broadcast message', () => {
      const validMessage = {
        type: 'message' as const,
        boardId: 'test-board-id',
        message: {
          id: 'test-message-id',
          topic: 'test-topic',
          data: 'test-data',
          boardId: 'test-board-id',
          userId: 'test-user-id',
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      };

      const result = broadcastMessageSchema.parse(validMessage);
      expect(result).toEqual(validMessage);
    });

    it('should reject broadcast message with wrong type', () => {
      const invalidMessage = {
        type: 'notification',
        boardId: 'test-board-id',
        message: {
          id: 'test-message-id',
          topic: 'test-topic',
          data: 'test-data',
          boardId: 'test-board-id',
          userId: 'test-user-id',
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      };

      expect(() => broadcastMessageSchema.parse(invalidMessage)).toThrow();
    });

    it('should reject broadcast message without required message fields', () => {
      const invalidMessage = {
        type: 'message',
        boardId: 'test-board-id',
        message: {
          id: 'test-message-id',
          topic: 'test-topic',
          // missing required fields
        },
      };

      expect(() => broadcastMessageSchema.parse(invalidMessage)).toThrow();
    });
  });
});
