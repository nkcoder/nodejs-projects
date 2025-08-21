// test/handlers/message.test.ts
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mockSend = vi.fn();
vi.mock('../../src/services/aws', () => ({
  snsClient: () => ({ send: mockSend }),
}));

import { PublishCommand } from '@aws-sdk/client-sns';
import { postMessage } from '../../src/handlers/message';

describe('message handler', () => {
  const mockTopicArn = 'arn:aws:sns:ap-southeast-2:123456789012:message-posting-topic';

  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockClear();
    process.env.MESSAGE_POSTING_TOPIC_ARN = mockTopicArn;
  });

  afterAll(() => {
    delete process.env.MESSAGE_POSTING_TOPIC_ARN;
  });

  const createEvent = (body: any, boardId: string = 'board-123'): APIGatewayProxyEvent => ({
    body: JSON.stringify(body),
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: `/boards/${boardId}/messages`,
    pathParameters: { boardId },
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
      resourcePath: '/boards/{boardId}/messages',
    } as APIGatewayProxyEvent['requestContext'],
    resource: '',
  });

  describe('postMessage', () => {
    it('should successfully post a message', async () => {
      const requestBody = {
        topic: 'Test Topic',
        data: 'This is a test message',
        userId: 'user123',
      };
      const boardId = 'board-456';
      const expectedPayload = { ...requestBody, boardId };

      mockSend.mockResolvedValueOnce({ MessageId: '123' });

      const event = createEvent(requestBody, boardId);
      const result = await postMessage(event);

      expect(result.statusCode).toBe(202);
      expect(JSON.parse(result.body)).toEqual({
        message: 'Message posting request is accepted.',
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(expect.any(PublishCommand));

      const publishCommand = mockSend.mock.calls[0][0] as PublishCommand;
      expect(publishCommand.input).toEqual({
        TopicArn: mockTopicArn,
        Message: JSON.stringify(expectedPayload),
      });
    });

    it('should handle missing boardId parameter', async () => {
      const requestBody = {
        topic: 'Test Topic',
        data: 'This is a test message',
        userId: 'user123',
      };

      const event = createEvent(requestBody);
      event.pathParameters = null;

      const result = await postMessage(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        message: 'Board ID parameter is required',
      });
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle empty boardId parameter', async () => {
      const requestBody = {
        topic: 'Test Topic',
        data: 'This is a test message',
        userId: 'user123',
      };

      const event = createEvent(requestBody, '');

      const result = await postMessage(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        message: 'Board ID parameter is required',
      });
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle invalid topic (too short)', async () => {
      const requestBody = {
        topic: '',
        data: 'This is a test message',
        userId: 'user123',
      };

      const event = createEvent(requestBody);

      await expect(postMessage(event)).rejects.toThrow();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle invalid topic (too long)', async () => {
      const requestBody = {
        topic: 'A'.repeat(201),
        data: 'This is a test message',
        userId: 'user123',
      };

      const event = createEvent(requestBody);

      await expect(postMessage(event)).rejects.toThrow();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle invalid data (too short)', async () => {
      const requestBody = {
        topic: 'Test Topic',
        data: '',
        userId: 'user123',
      };

      const event = createEvent(requestBody);

      await expect(postMessage(event)).rejects.toThrow();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle invalid data (too long)', async () => {
      const requestBody = {
        topic: 'Test Topic',
        data: 'A'.repeat(5001),
        userId: 'user123',
      };

      const event = createEvent(requestBody);

      await expect(postMessage(event)).rejects.toThrow();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle missing userId', async () => {
      const requestBody = {
        topic: 'Test Topic',
        data: 'This is a test message',
      };

      const event = createEvent(requestBody);

      await expect(postMessage(event)).rejects.toThrow();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle missing body', async () => {
      const event = createEvent(null);
      event.body = null;

      await expect(postMessage(event)).rejects.toThrow();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle empty body', async () => {
      const event = createEvent({});

      await expect(postMessage(event)).rejects.toThrow();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON in body', async () => {
      const event = createEvent({});
      event.body = 'invalid json';

      await expect(postMessage(event)).rejects.toThrow();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle SNS send error', async () => {
      const requestBody = {
        topic: 'Test Topic',
        data: 'This is a test message',
        userId: 'user123',
      };

      mockSend.mockRejectedValueOnce(new Error('SNS error'));

      const event = createEvent(requestBody);

      await expect(postMessage(event)).rejects.toThrow('SNS error');
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle missing topic ARN', async () => {
      delete process.env.MESSAGE_POSTING_TOPIC_ARN;

      const requestBody = {
        topic: 'Test Topic',
        data: 'This is a test message',
        userId: 'user123',
      };
      const boardId = 'board-456';

      mockSend.mockResolvedValueOnce({ MessageId: '123' });

      const event = createEvent(requestBody, boardId);
      const result = await postMessage(event);

      // Should still work but with undefined topic ARN
      expect(result.statusCode).toBe(202);

      const publishCommand = mockSend.mock.calls[0][0] as PublishCommand;
      expect(publishCommand.input.TopicArn).toBeUndefined();
    });

    it('should handle special characters in topic and data', async () => {
      const requestBody = {
        topic: 'Test Topic - Special #1!',
        data: 'This is a test message with "quotes" and special chars: @#$%',
        userId: 'user123',
      };

      mockSend.mockResolvedValueOnce({ MessageId: '123' });

      const event = createEvent(requestBody);
      const result = await postMessage(event);

      expect(result.statusCode).toBe(202);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle long valid data', async () => {
      const requestBody = {
        topic: 'Test Topic',
        data: 'A'.repeat(4999), // Max allowed is 5000
        userId: 'user123',
      };

      mockSend.mockResolvedValueOnce({ MessageId: '123' });

      const event = createEvent(requestBody);
      const result = await postMessage(event);

      expect(result.statusCode).toBe(202);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });
});
