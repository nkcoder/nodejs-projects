// test/utils/messageParser.test.ts
import type { SNSEventRecord, SQSRecord } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { MessageParsingError, parseSnsMessage, parseSqsMessage } from '../../src/utils/messageParser';

describe('messageParser', () => {
  const testSchema = z.object({
    name: z.string(),
    value: z.number(),
  });

  describe('parseSnsMessage', () => {
    it('should successfully parse valid SNS message', () => {
      const record: SNSEventRecord = {
        EventSource: 'aws:sns',
        EventVersion: '1.0',
        EventSubscriptionArn: 'test-arn',
        Sns: {
          Type: 'Notification',
          MessageId: 'test-id',
          TopicArn: 'test-topic-arn',
          Subject: 'test',
          Message: JSON.stringify({ name: 'test', value: 42 }),
          Timestamp: '2023-01-01T00:00:00.000Z',
          SignatureVersion: '1',
          Signature: 'test-signature',
          SigningCertUrl: 'test-cert-url',
          MessageAttributes: {},
        },
      };

      const result = parseSnsMessage(record, testSchema);

      expect(result).toEqual({ name: 'test', value: 42 });
    });

    it('should throw MessageParsingError for invalid JSON', () => {
      const record: SNSEventRecord = {
        EventSource: 'aws:sns',
        EventVersion: '1.0',
        EventSubscriptionArn: 'test-arn',
        Sns: {
          Type: 'Notification',
          MessageId: 'test-id',
          TopicArn: 'test-topic-arn',
          Subject: 'test',
          Message: 'invalid-json',
          Timestamp: '2023-01-01T00:00:00.000Z',
          SignatureVersion: '1',
          Signature: 'test-signature',
          SigningCertUrl: 'test-cert-url',
          MessageAttributes: {},
        },
      };

      expect(() => parseSnsMessage(record, testSchema)).toThrow(MessageParsingError);
      expect(() => parseSnsMessage(record, testSchema)).toThrow('Failed to parse JSON');
    });

    it('should throw MessageParsingError for schema validation failure', () => {
      const record: SNSEventRecord = {
        EventSource: 'aws:sns',
        EventVersion: '1.0',
        EventSubscriptionArn: 'test-arn',
        Sns: {
          Type: 'Notification',
          MessageId: 'test-id',
          TopicArn: 'test-topic-arn',
          Subject: 'test',
          Message: JSON.stringify({ name: 'test', value: 'not-a-number' }),
          Timestamp: '2023-01-01T00:00:00.000Z',
          SignatureVersion: '1',
          Signature: 'test-signature',
          SigningCertUrl: 'test-cert-url',
          MessageAttributes: {},
        },
      };

      expect(() => parseSnsMessage(record, testSchema)).toThrow(MessageParsingError);
      expect(() => parseSnsMessage(record, testSchema)).toThrow('Failed to validate SNS message against schema');
    });
  });

  describe('parseSqsMessage', () => {
    it('should successfully parse valid SQS message', () => {
      const record: SQSRecord = {
        messageId: 'test-id',
        receiptHandle: 'test-handle',
        body: JSON.stringify({ name: 'test', value: 42 }),
        attributes: {
          ApproximateReceiveCount: '1',
          SentTimestamp: '1609459200000',
          SenderId: 'test-sender',
          ApproximateFirstReceiveTimestamp: '1609459200000',
        },
        messageAttributes: {},
        md5OfBody: 'test-md5',
        eventSource: 'aws:sqs',
        eventSourceARN: 'test-arn',
        awsRegion: 'us-east-1',
      };

      const result = parseSqsMessage(record, testSchema);

      expect(result).toEqual({ name: 'test', value: 42 });
    });

    it('should throw MessageParsingError for invalid JSON', () => {
      const record: SQSRecord = {
        messageId: 'test-id',
        receiptHandle: 'test-handle',
        body: 'invalid-json',
        attributes: {
          ApproximateReceiveCount: '1',
          SentTimestamp: '1609459200000',
          SenderId: 'test-sender',
          ApproximateFirstReceiveTimestamp: '1609459200000',
        },
        messageAttributes: {},
        md5OfBody: 'test-md5',
        eventSource: 'aws:sqs',
        eventSourceARN: 'test-arn',
        awsRegion: 'us-east-1',
      };

      expect(() => parseSqsMessage(record, testSchema)).toThrow(MessageParsingError);
      expect(() => parseSqsMessage(record, testSchema)).toThrow('Failed to parse JSON');
    });

    it('should throw MessageParsingError for schema validation failure', () => {
      const record: SQSRecord = {
        messageId: 'test-id',
        receiptHandle: 'test-handle',
        body: JSON.stringify({ name: 'test', value: 'not-a-number' }),
        attributes: {
          ApproximateReceiveCount: '1',
          SentTimestamp: '1609459200000',
          SenderId: 'test-sender',
          ApproximateFirstReceiveTimestamp: '1609459200000',
        },
        messageAttributes: {},
        md5OfBody: 'test-md5',
        eventSource: 'aws:sqs',
        eventSourceARN: 'test-arn',
        awsRegion: 'us-east-1',
      };

      expect(() => parseSqsMessage(record, testSchema)).toThrow(MessageParsingError);
      expect(() => parseSqsMessage(record, testSchema)).toThrow('Failed to validate SQS message against schema');
    });
  });

  describe('MessageParsingError', () => {
    it('should properly chain errors', () => {
      const cause = new Error('Original error');
      const error = new MessageParsingError('Wrapper error', cause);

      expect(error.name).toBe('MessageParsingError');
      expect(error.message).toBe('Wrapper error');
      expect(error.cause).toBe(cause);
    });

    it('should work without a cause', () => {
      const error = new MessageParsingError('Simple error');

      expect(error.name).toBe('MessageParsingError');
      expect(error.message).toBe('Simple error');
      expect(error.cause).toBeUndefined();
    });
  });
});
