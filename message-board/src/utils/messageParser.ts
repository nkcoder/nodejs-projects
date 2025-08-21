import type { SNSEventRecord, SQSRecord } from 'aws-lambda';
import type { z } from 'zod';

export class MessageParsingError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'MessageParsingError';
  }
}

/**
 * Safely parse JSON from a string with proper error handling
 */
function safeJsonParse(jsonString: string): unknown {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    throw new MessageParsingError(
      `Failed to parse JSON: ${jsonString}`,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Safely parse and validate SNS message content
 */
export function parseSnsMessage<T>(record: SNSEventRecord, schema: z.ZodSchema<T>): T {
  try {
    const messageContent = safeJsonParse(record.Sns.Message);
    return schema.parse(messageContent);
  } catch (error) {
    if (error instanceof MessageParsingError) {
      throw error;
    }
    throw new MessageParsingError(
      `Failed to validate SNS message against schema`,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Safely parse and validate SQS message content
 */
export function parseSqsMessage<T>(record: SQSRecord, schema: z.ZodSchema<T>): T {
  try {
    const messageContent = safeJsonParse(record.body);
    return schema.parse(messageContent);
  } catch (error) {
    if (error instanceof MessageParsingError) {
      throw error;
    }
    throw new MessageParsingError(
      `Failed to validate SQS message against schema`,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}
