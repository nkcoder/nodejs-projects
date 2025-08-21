import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mockSend = vi.fn();
vi.mock('../../src/services/aws', () => ({
  dynamoDbClient: () => ({ send: mockSend }),
}));
vi.mock('../../src/services/idGenerator', () => ({
  generateId: vi.fn(),
}));

import { generateId } from '../../src/services/idGenerator';
import { createUser, getUserByEmail } from '../../src/services/userService';

describe('userService', () => {
  const mockIdGenerator = vi.mocked(generateId);

  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockClear();
  });

  beforeAll(() => {
    process.env.USERS_TABLE = 'users-table-test';
  });

  afterAll(() => {
    delete process.env.USERS_TABLE;
  });

  describe('createUser', () => {
    it('should create a user successfully when the user does not exist', async () => {
      mockIdGenerator.mockReturnValue('123');
      // get users by email, returns empty
      mockSend.mockResolvedValueOnce({ Items: [] });
      // create user
      mockSend.mockResolvedValueOnce({});
      const id = await createUser('test@test.com', 'Test User');
      expect(id).toBe('123');
      expect(mockIdGenerator).toHaveBeenCalled();
      expect(mockSend).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          input: {
            TableName: process.env.USERS_TABLE,
            IndexName: 'email-index',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: {
              ':email': 'test@test.com',
            },
          },
        })
      );
      expect(mockSend).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          input: {
            TableName: process.env.USERS_TABLE,
            Item: {
              id: '123',
              email: 'test@test.com',
              name: 'Test User',
              createdAt: expect.any(String), // Don't check exact timestamp
            },
          },
        })
      );
    });

    it('should throw error when user already exists', async () => {
      const email = 'existing@example.com';
      const name = 'Existing User';

      mockSend.mockResolvedValueOnce({
        Items: [
          {
            id: 'existing-id',
            email,
            name,
            createdAt: '2023-01-01T00:00:00.000Z',
          },
        ],
      });

      await expect(createUser(email, name)).rejects.toThrow(`User with email ${email} already exists`);

      expect(mockSend).toHaveBeenCalledTimes(1); // Only the query call
      expect(mockIdGenerator).not.toHaveBeenCalled();
    });

    it('should handle DynamoDB errors', async () => {
      const email = 'test@example.com';
      const name = 'Test User';

      // Mock getUserByEmail to return null
      mockSend.mockResolvedValueOnce({ Items: [] });

      // Mock generateId
      mockIdGenerator.mockReturnValue('mock-id');

      // Mock PutCommand to throw error
      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(createUser(email, name)).rejects.toThrow('DynamoDB error');
    });
  });

  describe('getUserByEmail', () => {
    it('should return user when email exists', async () => {
      const email = 'test@example.com';
      const name = 'Test User';

      mockSend.mockResolvedValueOnce({
        Items: [
          {
            id: '123',
            email,
            name,
            createdAt: '2023-01-01T00:00:00.000Z',
          },
        ],
      });

      const user = await getUserByEmail(email);

      expect(user).toEqual({
        id: '123',
        email,
        name,
        createdAt: '2023-01-01T00:00:00.000Z',
      });
    });

    it('should return null when email does not exist', async () => {
      const email = 'nonexistent@example.com';

      mockSend.mockResolvedValueOnce({ Items: [] });

      const user = await getUserByEmail(email);

      expect(user).toBeNull();
    });

    it('should handle DynamoDB errors', async () => {
      const email = 'test@example.com';

      mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));

      await expect(getUserByEmail(email)).rejects.toThrow('DynamoDB error');
    });
  });
});
