// test/handlers/user.test.ts
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as userService from '../../src/services/userService';

const mockSend = vi.fn();
vi.mock('../../src/services/aws', () => ({
  snsClient: () => ({ send: mockSend }),
}));

vi.mock('../../src/services/userService', () => ({
  getUserByEmail: vi.fn(),
}));

import { PublishCommand } from '@aws-sdk/client-sns';
import { getUserByEmail, registerUser } from '../../src/handlers/user';

describe('user handler', () => {
  const mockTopicArn = 'arn:aws:sns:ap-southeast-2:123456789012:user-registration-topic';

  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockClear();
    process.env.USER_REGISTRATION_TOPIC_ARN = mockTopicArn;
  });

  afterAll(() => {
    delete process.env.USER_REGISTRATION_TOPIC_ARN;
  });

  // TODO: to test invalid input, we might need to define a specific type for the input, rather than using any
  const createEvent = (body: any): APIGatewayProxyEvent => ({
    body: JSON.stringify(body),
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/users/register',
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
      resourcePath: '/users/register',
    } as APIGatewayProxyEvent['requestContext'],
    resource: '',
  });

  describe('registerUser', () => {
    it('should successfully register a user', async () => {
      const requestBody = {
        email: 'test@example.com',
        name: 'Test User',
      };

      mockSend.mockResolvedValueOnce({ MessageId: '123' });

      const event = createEvent(requestBody);
      const result = await registerUser(event);

      expect(result.statusCode).toBe(202);
      expect(JSON.parse(result.body)).toEqual({
        message: 'User registration request is accepted.',
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(expect.any(PublishCommand));

      const publishCommand = mockSend.mock.calls[0][0] as PublishCommand;
      expect(publishCommand.input).toEqual({
        TopicArn: mockTopicArn,
        Message: JSON.stringify(requestBody),
      });
    });

    it('should handle invalid email format', async () => {
      const requestBody = {
        email: 'invalid-email',
        name: 'Test User',
      };

      const event = createEvent(requestBody);

      await expect(registerUser(event)).rejects.toThrow();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle invalid name (too short, less than 2 characters)', async () => {
      const requestBody = {
        email: 'test@example.com',
        name: 'A',
      };

      const event = createEvent(requestBody);

      await expect(registerUser(event)).rejects.toThrow();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle invalid name (too long, more than 30 characters)', async () => {
      const requestBody = {
        email: 'test@example.com',
        name: 'A'.repeat(31),
      };

      const event = createEvent(requestBody);

      await expect(registerUser(event)).rejects.toThrow();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle missing body', async () => {
      const event = createEvent(null);
      event.body = null;

      await expect(registerUser(event)).rejects.toThrow();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle empty body', async () => {
      const event = createEvent({});

      await expect(registerUser(event)).rejects.toThrow();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON in body', async () => {
      const event = createEvent({});
      event.body = 'invalid json';

      await expect(registerUser(event)).rejects.toThrow();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle SNS send error', async () => {
      const requestBody = {
        email: 'test@example.com',
        name: 'Test User',
      };

      mockSend.mockRejectedValueOnce(new Error('SNS error'));

      const event = createEvent(requestBody);

      await expect(registerUser(event)).rejects.toThrow('SNS error');
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle missing topic ARN', async () => {
      delete process.env.USER_REGISTRATION_TOPIC_ARN;

      const requestBody = {
        email: 'test@example.com',
        name: 'Test User',
      };

      mockSend.mockResolvedValueOnce({ MessageId: '123' });

      const event = createEvent(requestBody);
      const result = await registerUser(event);

      // Should still work but with undefined topic ARN
      expect(result.statusCode).toBe(202);

      const publishCommand = mockSend.mock.calls[0][0] as PublishCommand;
      expect(publishCommand.input.TopicArn).toBeUndefined();
    });

    it('should handle special characters in name', async () => {
      const requestBody = {
        email: 'test@example.com',
        name: "Test User-O'Brien",
      };

      mockSend.mockResolvedValueOnce({ MessageId: '123' });

      const event = createEvent(requestBody);
      const result = await registerUser(event);

      expect(result.statusCode).toBe(202);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserByEmail', () => {
    it('should return user data', async () => {
      const email = 'test@example.com';
      const user = {
        id: '123',
        email,
        name: 'Test User',
        createdAt: new Date().toISOString(),
      };

      vi.mocked(userService.getUserByEmail).mockResolvedValueOnce(user);

      // Create event with path parameters
      const event = {
        ...createEvent({}),
        pathParameters: { email },
      };

      const result = await getUserByEmail(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual(user);
    });

    it('should handle user not found', async () => {
      const email = 'test@example.com';

      vi.mocked(userService.getUserByEmail).mockResolvedValueOnce(null);

      // Create event with path parameters
      const event = {
        ...createEvent({}),
        pathParameters: { email },
      };

      const result = await getUserByEmail(event);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body)).toEqual({
        message: `User with email ${email} not found`,
      });
    });

    it('should handle missing email parameter', async () => {
      const event = {
        ...createEvent({}),
        pathParameters: null,
      };

      const result = await getUserByEmail(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        message: 'Email parameter is required',
      });
    });

    it('should handle invalid email format', async () => {
      const invalidEmail = 'invalid-email';

      const event = {
        ...createEvent({}),
        pathParameters: { email: invalidEmail },
      };

      const result = await getUserByEmail(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        message: 'Invalid email format',
      });
    });
  });
});
