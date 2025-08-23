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
      apiId: 'test-api-id',
      domainName: 'test.execute-api.us-east-1.amazonaws.com',
      httpMethod: 'POST',
      path: '/users/register',
      stage: 'dev',
      requestId: 'test-request-id',
      requestTime: '01/Jan/2024:00:00:00 +0000',
      requestTimeEpoch: 1704067200000,
      resourceId: 'test-resource-id',
      resourcePath: '/users/register',
      protocol: 'HTTP/1.1',
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        clientCert: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: '127.0.0.1',
        user: null,
        userAgent: 'test-user-agent',
        userArn: null,
      },
      authorizer: {},
    },
    resource: '/users/register',
  });

  describe('registerUser', () => {
    it('should successfully register a user', async () => {
      mockSend.mockResolvedValue({});

      const requestBody = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const event = createEvent(requestBody);
      const result = await registerUser(event);

      expect(result.statusCode).toBe(202);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toMatchObject({
        message: 'User registration request is accepted.',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TopicArn: mockTopicArn,
            Message: JSON.stringify(requestBody),
          }),
        })
      );
    });

    it('should handle invalid email format', async () => {
      const requestBody = {
        email: 'invalid-email',
        name: 'Test User',
      };

      const event = createEvent(requestBody);
      const result = await registerUser(event);

      expect(result.statusCode).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle invalid name (too short, less than 2 characters)', async () => {
      const requestBody = {
        email: 'test@example.com',
        name: 'A',
      };

      const event = createEvent(requestBody);
      const result = await registerUser(event);

      expect(result.statusCode).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle invalid name (too long, more than 30 characters)', async () => {
      const requestBody = {
        email: 'test@example.com',
        name: 'This is a really long name that exceeds limit',
      };

      const event = createEvent(requestBody);
      const result = await registerUser(event);

      expect(result.statusCode).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle missing body', async () => {
      const event = createEvent(null);
      event.body = null;
      const result = await registerUser(event);

      expect(result.statusCode).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle empty body', async () => {
      const event = createEvent({});
      const result = await registerUser(event);

      expect(result.statusCode).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON in body', async () => {
      const event = createEvent({});
      event.body = 'invalid json';
      const result = await registerUser(event);

      expect(result.statusCode).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle SNS send error', async () => {
      mockSend.mockRejectedValue(new Error('SNS error'));

      const requestBody = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const event = createEvent(requestBody);
      const result = await registerUser(event);

      expect(result.statusCode).toBe(500);
      expect(mockSend).toHaveBeenCalled();
    });

    it('should handle missing topic ARN', async () => {
      delete process.env.USER_REGISTRATION_TOPIC_ARN;

      const requestBody = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const event = createEvent(requestBody);
      const result = await registerUser(event);

      expect(result.statusCode).toBe(500);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle special characters in name', async () => {
      mockSend.mockResolvedValue({});

      const requestBody = {
        email: 'test@example.com',
        name: "O'Brien-Smith",
      };

      const event = createEvent(requestBody);
      const result = await registerUser(event);

      expect(result.statusCode).toBe(202);
      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe('getUserByEmail', () => {
    const createEventWithEmail = (email: string | null): APIGatewayProxyEvent => ({
      body: null,
      headers: {},
      multiValueHeaders: {},
      httpMethod: 'GET',
      isBase64Encoded: false,
      path: `/users/${email}`,
      pathParameters: email ? { email } : null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {
        accountId: '123456789012',
        apiId: 'test-api-id',
        domainName: 'test.execute-api.us-east-1.amazonaws.com',
        httpMethod: 'GET',
        path: `/users/${email}`,
        stage: 'dev',
        requestId: 'test-request-id',
        requestTime: '01/Jan/2024:00:00:00 +0000',
        requestTimeEpoch: 1704067200000,
        resourceId: 'test-resource-id',
        resourcePath: '/users/{email}',
        protocol: 'HTTP/1.1',
        identity: {
          accessKey: null,
          accountId: null,
          apiKey: null,
          apiKeyId: null,
          caller: null,
          clientCert: null,
          cognitoAuthenticationProvider: null,
          cognitoAuthenticationType: null,
          cognitoIdentityId: null,
          cognitoIdentityPoolId: null,
          principalOrgId: null,
          sourceIp: '127.0.0.1',
          user: null,
          userAgent: 'test-user-agent',
          userArn: null,
        },
        authorizer: {},
      },
      resource: '/users/{email}',
    });

    it('should return user data', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      (userService.getUserByEmail as any).mockResolvedValue(mockUser);

      const event = createEventWithEmail('test@example.com');
      const result = await getUserByEmail(event);

      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toEqual(mockUser);
    });

    it('should handle user not found', async () => {
      (userService.getUserByEmail as any).mockResolvedValue(null);

      const event = createEventWithEmail('nonexistent@example.com');
      const result = await getUserByEmail(event);

      expect(result.statusCode).toBe(404);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error.message).toContain('not found');
    });

    it('should handle missing email parameter', async () => {
      const event = createEventWithEmail(null);
      const result = await getUserByEmail(event);

      expect(result.statusCode).toBe(400);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error.message).toContain('email parameter is required');
    });

    it('should handle invalid email format', async () => {
      const event = createEventWithEmail('invalid-email');
      const result = await getUserByEmail(event);

      expect(result.statusCode).toBe(400);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error.message).toContain('Invalid email');
    });

    it('should handle service error', async () => {
      (userService.getUserByEmail as any).mockRejectedValue(new Error('Database error'));

      const event = createEventWithEmail('test@example.com');
      const result = await getUserByEmail(event);

      expect(result.statusCode).toBe(500);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.success).toBe(false);
    });
  });
});
