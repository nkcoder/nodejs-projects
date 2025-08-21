// test/services/messageService.test.ts
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mockSend = vi.fn();

vi.mock('../../src/services/aws', () => ({
  dynamoDbClient: () => ({ send: mockSend }),
}));

vi.mock('../../src/services/idGenerator', () => ({
  generateId: vi.fn(),
}));

import { createMessage, getMessagesByBoardId } from '../../src/services/messageService';
import { generateId } from '../../src/services/idGenerator';

describe('messageService', () => {
  const mockTableName = 'messages-table-test';

  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockClear();
    process.env.MESSAGES_TABLE = mockTableName;
  });

  afterAll(() => {
    delete process.env.MESSAGES_TABLE;
  });

  describe('createMessage', () => {
    it('should create a message successfully', async () => {
      const mockId = 'message-123';
      const topic = 'Test Topic';
      const data = 'Test message data';
      const boardId = 'board-456';
      const userId = 'user-789';

      vi.mocked(generateId).mockReturnValueOnce(mockId);
      mockSend.mockResolvedValueOnce({});

      const result = await createMessage(topic, data, boardId, userId);

      expect(result).toBe(mockId);
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(expect.any(PutCommand));

      const putCommand = mockSend.mock.calls[0][0] as PutCommand;
      expect(putCommand.input.TableName).toBe(mockTableName);
      expect(putCommand.input.Item).toMatchObject({
        id: mockId,
        topic,
        data,
        boardId,
        userId,
      });
      expect(putCommand.input.Item?.createdAt).toBeDefined();
    });

    it('should handle DynamoDB error', async () => {
      const mockId = 'message-123';
      vi.mocked(generateId).mockReturnValueOnce(mockId);
      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(createMessage('topic', 'data', 'board', 'user')).rejects.toThrow('DynamoDB error');
    });
  });

  describe('getMessagesByBoardId', () => {
    it('should return messages for a board', async () => {
      const mockBoardId = 'board-123';
      const mockItems = [
        {
          id: 'message-1',
          topic: 'Topic 1',
          data: 'Message 1 data',
          boardId: mockBoardId,
          userId: 'user1',
          createdAt: '2023-01-01T00:00:00.000Z',
        },
        {
          id: 'message-2',
          topic: 'Topic 2',
          data: 'Message 2 data',
          boardId: mockBoardId,
          userId: 'user2',
          createdAt: '2023-01-02T00:00:00.000Z',
        },
      ];

      mockSend.mockResolvedValueOnce({
        Items: mockItems,
      });

      const result = await getMessagesByBoardId(mockBoardId);

      expect(result).toEqual(mockItems);
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(expect.any(QueryCommand));

      const queryCommand = mockSend.mock.calls[0][0] as QueryCommand;
      expect(queryCommand.input.TableName).toBe(mockTableName);
      expect(queryCommand.input.IndexName).toBe('boardId-index');
      expect(queryCommand.input.KeyConditionExpression).toBe('boardId = :boardId');
      expect(queryCommand.input.ExpressionAttributeValues).toEqual({
        ':boardId': mockBoardId,
      });
    });

    it('should return empty array when no messages exist', async () => {
      mockSend.mockResolvedValueOnce({
        Items: [],
      });

      const result = await getMessagesByBoardId('board-123');

      expect(result).toEqual([]);
    });

    it('should return empty array when Items is undefined', async () => {
      mockSend.mockResolvedValueOnce({});

      const result = await getMessagesByBoardId('board-123');

      expect(result).toEqual([]);
    });

    it('should handle DynamoDB error', async () => {
      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(getMessagesByBoardId('board-123')).rejects.toThrow('DynamoDB error');
    });

    it('should handle invalid message data', async () => {
      const invalidItems = [
        {
          // Missing required fields
          id: 'message-1',
          topic: 'Topic 1',
        },
      ];

      mockSend.mockResolvedValueOnce({
        Items: invalidItems,
      });

      await expect(getMessagesByBoardId('board-123')).rejects.toThrow();
    });

    it('should handle multiple messages with different users', async () => {
      const mockBoardId = 'board-456';
      const mockItems = [
        {
          id: 'message-1',
          topic: 'General Discussion',
          data: 'Hello everyone!',
          boardId: mockBoardId,
          userId: 'user1',
          createdAt: '2023-01-01T10:00:00.000Z',
        },
        {
          id: 'message-2',
          topic: 'General Discussion',
          data: 'How is everyone doing?',
          boardId: mockBoardId,
          userId: 'user2',
          createdAt: '2023-01-01T10:01:00.000Z',
        },
        {
          id: 'message-3',
          topic: 'Technical Question',
          data: 'Does anyone know how to...?',
          boardId: mockBoardId,
          userId: 'user1',
          createdAt: '2023-01-01T10:02:00.000Z',
        },
      ];

      mockSend.mockResolvedValueOnce({
        Items: mockItems,
      });

      const result = await getMessagesByBoardId(mockBoardId);

      expect(result).toEqual(mockItems);
      expect(result).toHaveLength(3);
    });
  });
});
