// test/handlers/board.test.ts
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as boardService from '../../src/services/boardService';

const mockSend = vi.fn();
vi.mock('../../src/services/aws', () => ({
  sqsClient: () => ({ send: mockSend }),
}));

vi.mock('../../src/services/boardService', () => ({
  listBoards: vi.fn(),
}));

import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { createBoard, listBoards } from '../../src/handlers/board';

describe('board handler', () => {
  const mockQueueUrl = 'https://sqs.ap-southeast-2.amazonaws.com/123456789012/board-creation-queue';

  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockClear();
    process.env.BOARD_CREATION_QUEUE_URL = mockQueueUrl;
  });

  afterAll(() => {
    delete process.env.BOARD_CREATION_QUEUE_URL;
  });

  const createEvent = (body: any): APIGatewayProxyEvent => ({
    body: JSON.stringify(body),
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/boards',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api',
      stage: 'test',
      requestId: 'test-request-id',
      identity: {
        sourceIp: '127.0.0.1',
        userAgent: 'test-agent',
      },
      httpMethod: 'POST',
      resourcePath: '/boards',
    } as APIGatewayProxyEvent['requestContext'],
    resource: '',
  });

  describe('createBoard', () => {
    it('should successfully create a board', async () => {
      const requestBody = {
        name: 'Test Board',
        createdBy: 'user123',
      };

      mockSend.mockResolvedValueOnce({ MessageId: '123' });

      const event = createEvent(requestBody);
      const result = await createBoard(event);

      expect(result.statusCode).toBe(202);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toMatchObject({
        message: 'Board creation request is accepted.',
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(expect.any(SendMessageCommand));

      const sendMessageCommand = mockSend.mock.calls[0][0] as SendMessageCommand;
      expect(sendMessageCommand.input).toEqual({
        QueueUrl: mockQueueUrl,
        MessageBody: JSON.stringify(requestBody),
      });
    });

    it('should handle invalid board name (too short)', async () => {
      const requestBody = {
        name: 'A',
        createdBy: 'user123',
      };

      const event = createEvent(requestBody);
      const result = await createBoard(event);

      expect(result.statusCode).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle invalid board name (too long)', async () => {
      const requestBody = {
        name: 'A'.repeat(101),
        createdBy: 'user123',
      };

      const event = createEvent(requestBody);
      const result = await createBoard(event);

      expect(result.statusCode).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle missing name', async () => {
      const requestBody = {
        createdBy: 'user123',
      };

      const event = createEvent(requestBody);
      const result = await createBoard(event);

      expect(result.statusCode).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle missing createdBy', async () => {
      const requestBody = {
        name: 'Test Board',
      };

      const event = createEvent(requestBody);
      const result = await createBoard(event);

      expect(result.statusCode).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle missing body', async () => {
      const event = createEvent(null);
      event.body = null;

      const result = await createBoard(event);

      expect(result.statusCode).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle empty body', async () => {
      const event = createEvent({});
      const result = await createBoard(event);

      expect(result.statusCode).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON in body', async () => {
      const event = createEvent({});
      event.body = 'invalid json';

      const result = await createBoard(event);

      expect(result.statusCode).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle SQS send error', async () => {
      const requestBody = {
        name: 'Test Board',
        createdBy: 'user123',
      };

      mockSend.mockRejectedValueOnce(new Error('SQS error'));

      const event = createEvent(requestBody);
      const result = await createBoard(event);

      expect(result.statusCode).toBe(500);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle missing queue URL', async () => {
      delete process.env.BOARD_CREATION_QUEUE_URL;

      const requestBody = {
        name: 'Test Board',
        createdBy: 'user123',
      };

      const event = createEvent(requestBody);
      const result = await createBoard(event);

      // Should return 500 error when queue URL is not configured
      expect(result.statusCode).toBe(500);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle special characters in board name', async () => {
      const requestBody = {
        name: 'Test Board - Project #1',
        createdBy: 'user123',
      };

      mockSend.mockResolvedValueOnce({ MessageId: '123' });

      const event = createEvent(requestBody);
      const result = await createBoard(event);

      expect(result.statusCode).toBe(202);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('listBoards', () => {
    it('should return list of boards', async () => {
      const boards = [
        {
          id: '123',
          name: 'Board 1',
          createdBy: 'user1',
          createdAt: '2023-01-01T00:00:00.000Z',
        },
        {
          id: '456',
          name: 'Board 2',
          createdBy: 'user2',
          createdAt: '2023-01-02T00:00:00.000Z',
        },
      ];

      vi.mocked(boardService.listBoards).mockResolvedValueOnce(boards);

      const event = createEvent({});
      const result = await listBoards(event);

      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toEqual(boards);
    });

    it('should return empty array when no boards exist', async () => {
      vi.mocked(boardService.listBoards).mockResolvedValueOnce([]);

      const event = createEvent({});
      const result = await listBoards(event);

      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toEqual([]);
    });

    it('should handle service error', async () => {
      vi.mocked(boardService.listBoards).mockRejectedValueOnce(new Error('Database error'));

      const event = createEvent({});
      const result = await listBoards(event);

      expect(result.statusCode).toBe(500);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(false);
    });
  });
});
