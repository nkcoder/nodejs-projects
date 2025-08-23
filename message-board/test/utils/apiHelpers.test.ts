// test/utils/apiHelpers.test.ts
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  ApiError,
  parseRequestBody,
  validateRequestBody,
  getPathParameter,
  createSuccessResponse,
  createAcceptedResponse,
  createErrorResponse,
  withErrorHandling,
} from '../../src/utils/apiHelpers';

describe('apiHelpers', () => {
  describe('ApiError', () => {
    it('should create ApiError with status code and message', () => {
      const error = new ApiError(400, 'Test error');

      expect(error.name).toBe('ApiError');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.cause).toBeUndefined();
    });

    it('should create ApiError with cause', () => {
      const cause = new Error('Original error');
      const error = new ApiError(500, 'Wrapper error', cause);

      expect(error.name).toBe('ApiError');
      expect(error.message).toBe('Wrapper error');
      expect(error.statusCode).toBe(500);
      expect(error.cause).toBe(cause);
    });
  });

  describe('parseRequestBody', () => {
    it('should parse valid JSON body', () => {
      const body = '{"name": "test", "value": 42}';
      const result = parseRequestBody(body);

      expect(result).toEqual({ name: 'test', value: 42 });
    });

    it('should throw ApiError for null body', () => {
      expect(() => parseRequestBody(null)).toThrow(ApiError);
      expect(() => parseRequestBody(null)).toThrow('Request body is required');
    });

    it('should throw ApiError for empty body', () => {
      expect(() => parseRequestBody('')).toThrow(ApiError);
      expect(() => parseRequestBody('  ')).toThrow(ApiError);
    });

    it('should throw ApiError for invalid JSON', () => {
      expect(() => parseRequestBody('invalid json')).toThrow(ApiError);
      expect(() => parseRequestBody('invalid json')).toThrow('Invalid JSON in request body');
    });
  });

  describe('validateRequestBody', () => {
    const testSchema = z.object({
      name: z.string(),
      value: z.number(),
    });

    it('should validate and return parsed data', () => {
      const body = '{"name": "test", "value": 42}';
      const result = validateRequestBody(body, testSchema);

      expect(result).toEqual({ name: 'test', value: 42 });
    });

    it('should throw ApiError for validation failure', () => {
      const body = '{"name": "test", "value": "not-a-number"}';

      expect(() => validateRequestBody(body, testSchema)).toThrow(ApiError);
      expect(() => validateRequestBody(body, testSchema)).toThrow('Request validation failed');
    });

    it('should propagate ApiError from parseRequestBody', () => {
      expect(() => validateRequestBody(null, testSchema)).toThrow('Request body is required');
    });
  });

  describe('getPathParameter', () => {
    const createEvent = (pathParameters: Record<string, string> | null): APIGatewayProxyEvent => ({
      pathParameters,
      httpMethod: 'GET',
      path: '/test',
      headers: {},
      multiValueHeaders: {},
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      body: null,
      isBase64Encoded: false,
      stageVariables: null,
      requestContext: {} as any,
      resource: '',
    });

    it('should extract and decode path parameter', () => {
      const event = createEvent({ email: 'test%40example.com' });
      const result = getPathParameter(event, 'email');

      expect(result).toBe('test@example.com');
    });

    it('should throw ApiError for missing parameter', () => {
      const event = createEvent(null);

      expect(() => getPathParameter(event, 'email')).toThrow(ApiError);
      expect(() => getPathParameter(event, 'email')).toThrow('email parameter is required');
    });

    it('should throw ApiError for empty parameter', () => {
      const event = createEvent({ email: '' });

      expect(() => getPathParameter(event, 'email')).toThrow(ApiError);
    });
  });

  describe('createSuccessResponse', () => {
    it('should create success response with data', () => {
      const data = { name: 'test', value: 42 };
      const response = createSuccessResponse(data);

      expect(response.statusCode).toBe(200);
      expect(response.headers?.['Content-Type']).toBe('application/json');

      const body = JSON.parse(response.body);
      expect(body).toEqual({
        success: true,
        data,
      });
    });

    it('should create success response with custom status code', () => {
      const data = { id: '123' };
      const response = createSuccessResponse(data, 201);

      expect(response.statusCode).toBe(201);
    });
  });

  describe('createAcceptedResponse', () => {
    it('should create accepted response', () => {
      const message = 'Request accepted';
      const response = createAcceptedResponse(message);

      expect(response.statusCode).toBe(202);
      expect(response.headers?.['Content-Type']).toBe('application/json');

      const body = JSON.parse(response.body);
      expect(body).toEqual({
        success: true,
        data: { message },
      });
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response from ApiError', () => {
      const error = new ApiError(400, 'Validation failed');
      const response = createErrorResponse(error);

      expect(response.statusCode).toBe(400);
      expect(response.headers?.['Content-Type']).toBe('application/json');

      const body = JSON.parse(response.body);
      expect(body).toEqual({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'ApiError',
        },
      });
    });

    it('should create error response from generic Error', () => {
      const error = new Error('Something went wrong');
      const response = createErrorResponse(error);

      expect(response.statusCode).toBe(500);

      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.message).toBe('Something went wrong');
      expect(body.error.code).toBe('Error');
    });

    it('should use custom status code', () => {
      const error = new Error('Not found');
      const response = createErrorResponse(error, 404);

      expect(response.statusCode).toBe(404);
    });
  });

  describe('withErrorHandling', () => {
    it('should wrap handler and return success', async () => {
      const mockHandler = vi.fn().mockResolvedValue({
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      });

      const wrappedHandler = withErrorHandling('testOperation', mockHandler);
      const event = {} as APIGatewayProxyEvent;
      event.requestContext = { requestId: 'test-123' } as any;

      const result = await wrappedHandler(event);

      expect(result.statusCode).toBe(200);
      expect(mockHandler).toHaveBeenCalledWith(event);
    });

    it('should catch and handle ApiError', async () => {
      const mockHandler = vi.fn().mockRejectedValue(new ApiError(400, 'Bad request'));

      const wrappedHandler = withErrorHandling('testOperation', mockHandler);
      const event = {} as APIGatewayProxyEvent;
      event.requestContext = { requestId: 'test-123' } as any;

      const result = await wrappedHandler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.message).toBe('Bad request');
    });

    it('should catch and handle generic Error', async () => {
      const mockHandler = vi.fn().mockRejectedValue(new Error('Unexpected error'));

      const wrappedHandler = withErrorHandling('testOperation', mockHandler);
      const event = {} as APIGatewayProxyEvent;
      event.requestContext = { requestId: 'test-123' } as any;

      const result = await wrappedHandler(event);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error.message).toBe('Unexpected error');
    });
  });
});
