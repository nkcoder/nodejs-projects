import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import type { z } from 'zod';

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Standard API response format
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * Safe JSON parsing with proper error handling
 */
export function parseRequestBody(body: string | null): unknown {
  if (!body || body.trim() === '') {
    throw new ApiError(400, 'Request body is required');
  }

  try {
    return JSON.parse(body);
  } catch (error) {
    throw new ApiError(
      400,
      'Invalid JSON in request body',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Validate request body with Zod schema
 */
export function validateRequestBody<T>(body: string | null, schema: z.ZodSchema<T>): T {
  try {
    const parsed = parseRequestBody(body);
    return schema.parse(parsed);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      400,
      'Request validation failed',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Extract and validate path parameter
 */
export function getPathParameter(event: APIGatewayProxyEvent, paramName: string): string {
  const value = event.pathParameters?.[paramName];
  if (!value || value.trim() === '') {
    throw new ApiError(400, `${paramName} parameter is required`);
  }
  return decodeURIComponent(value);
}

/**
 * Create successful API response
 */
export function createSuccessResponse<T>(data: T, statusCode = 200): APIGatewayProxyResult {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(response),
  };
}

/**
 * Create accepted response for async operations
 */
export function createAcceptedResponse(message: string): APIGatewayProxyResult {
  const response: ApiResponse = {
    success: true,
    data: { message },
  };

  return {
    statusCode: 202,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(response),
  };
}

/**
 * Create error response
 */
export function createErrorResponse(error: Error, statusCode?: number): APIGatewayProxyResult {
  const code = statusCode || (error instanceof ApiError ? error.statusCode : 500);
  
  const response: ApiResponse = {
    success: false,
    error: {
      message: error.message,
      code: error.name,
    },
  };

  return {
    statusCode: code,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(response),
  };
}

/**
 * Structured logging utility
 */
export function logRequest(operation: string, event: APIGatewayProxyEvent, additionalData?: unknown): void {
  console.info('API Request', {
    operation,
    method: event.httpMethod,
    path: event.path,
    pathParameters: event.pathParameters,
    queryStringParameters: event.queryStringParameters,
    requestId: event.requestContext.requestId,
    ...(additionalData ? { data: additionalData } : {}),
  });
}

/**
 * Log successful operation
 */
export function logSuccess(operation: string, result: unknown, requestId?: string): void {
  console.info('API Success', {
    operation,
    result: typeof result === 'object' ? 'object' : result,
    requestId,
  });
}

/**
 * Log error with context
 */
export function logError(operation: string, error: Error, requestId?: string): void {
  console.error('API Error', {
    operation,
    error: error.message,
    stack: error.stack,
    cause: error.cause instanceof Error ? error.cause.message : error.cause,
    requestId,
  });
}

/**
 * Higher-order function to wrap handlers with error handling
 */
export function withErrorHandling(
  operation: string,
  handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>
) {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const requestId = event.requestContext.requestId;
    
    try {
      logRequest(operation, event);
      const result = await handler(event);
      logSuccess(operation, { statusCode: result.statusCode }, requestId);
      return result;
    } catch (error) {
      const apiError = error instanceof Error ? error : new Error(String(error));
      logError(operation, apiError, requestId);
      return createErrorResponse(apiError);
    }
  };
}