// test/services/boardService.test.ts
import { PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mockSend = vi.fn();

vi.mock('../../src/services/aws', () => ({
  dynamoDbClient: () => ({ send: mockSend }),
}));

vi.mock('../../src/services/idGenerator', () => ({
  generateId: vi.fn(),
}));

import { createBoard, listBoards } from '../../src/services/boardService';
import { generateId } from '../../src/services/idGenerator';

describe('boardService', () => {
  const mockTableName = 'boards-table-test';

  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockClear();
    process.env.BOARDS_TABLE = mockTableName;
  });

  afterAll(() => {
    delete process.env.BOARDS_TABLE;
  });

  describe('createBoard', () => {
    it('should create a board successfully', async () => {
      const mockId = 'board-123';
      const name = 'Test Board';
      const createdBy = 'user123';

      vi.mocked(generateId).mockReturnValueOnce(mockId);
      mockSend.mockResolvedValueOnce({});

      const result = await createBoard(name, createdBy);

      expect(result).toBe(mockId);
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(expect.any(PutCommand));

      const putCommand = mockSend.mock.calls[0][0] as PutCommand;
      expect(putCommand.input.TableName).toBe(mockTableName);
      expect(putCommand.input.Item).toMatchObject({
        id: mockId,
        name,
        createdBy,
      });
      expect(putCommand.input.Item?.createdAt).toBeDefined();
    });

    it('should handle DynamoDB error', async () => {
      const mockId = 'board-123';
      vi.mocked(generateId).mockReturnValueOnce(mockId);
      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(createBoard('Test Board', 'user123')).rejects.toThrow('DynamoDB error');
    });
  });

  describe('listBoards', () => {
    it('should return list of boards', async () => {
      const mockItems = [
        {
          id: 'board-1',
          name: 'Board 1',
          createdBy: 'user1',
          createdAt: '2023-01-01T00:00:00.000Z',
        },
        {
          id: 'board-2',
          name: 'Board 2',
          createdBy: 'user2',
          createdAt: '2023-01-02T00:00:00.000Z',
        },
      ];

      mockSend.mockResolvedValueOnce({
        Items: mockItems,
      });

      const result = await listBoards();

      expect(result).toEqual(mockItems);
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(expect.any(ScanCommand));

      const scanCommand = mockSend.mock.calls[0][0] as ScanCommand;
      expect(scanCommand.input.TableName).toBe(mockTableName);
    });

    it('should return empty array when no boards exist', async () => {
      mockSend.mockResolvedValueOnce({
        Items: [],
      });

      const result = await listBoards();

      expect(result).toEqual([]);
    });

    it('should return empty array when Items is undefined', async () => {
      mockSend.mockResolvedValueOnce({});

      const result = await listBoards();

      expect(result).toEqual([]);
    });

    it('should handle DynamoDB error', async () => {
      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(listBoards()).rejects.toThrow('DynamoDB error');
    });

    it('should handle invalid board data', async () => {
      const invalidItems = [
        {
          // Missing required fields
          id: 'board-1',
        },
      ];

      mockSend.mockResolvedValueOnce({
        Items: invalidItems,
      });

      await expect(listBoards()).rejects.toThrow();
    });
  });
});
