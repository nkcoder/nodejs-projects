// test/handlers/processors.test.ts
import type { SNSEvent, SQSEvent } from 'aws-lambda';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the services
vi.mock('../../src/services/userService', () => ({
  createUser: vi.fn(),
}));

vi.mock('../../src/services/boardService', () => ({
  createBoard: vi.fn(),
}));

vi.mock('../../src/services/messageService', () => ({
  createMessage: vi.fn(),
}));

import { processUserRegistration, processBoardCreation, processMessagePosting } from '../../src/handlers/processors';
import { createUser } from '../../src/services/userService';
import { createBoard } from '../../src/services/boardService';
import { createMessage } from '../../src/services/messageService';

describe('processors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('processUserRegistration', () => {
    it('should successfully process valid user registration', async () => {
      const mockEvent: SNSEvent = {
        Records: [
          {
            EventSource: 'aws:sns',
            EventVersion: '1.0',
            EventSubscriptionArn: 'test-arn',
            Sns: {
              Type: 'Notification',
              MessageId: 'test-id',
              TopicArn: 'test-topic-arn',
              Subject: 'test',
              Message: JSON.stringify({ email: 'test@example.com', name: 'Test User' }),
              Timestamp: '2023-01-01T00:00:00.000Z',
              SignatureVersion: '1',
              Signature: 'test-signature',
              SigningCertUrl: 'test-cert-url',
              UnsubscribeUrl: 'test-unsubscribe-url',
              MessageAttributes: {},
            },
          },
        ],
      };

      vi.mocked(createUser).mockResolvedValueOnce('user-123');

      await processUserRegistration(mockEvent);

      expect(vi.mocked(createUser)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(createUser)).toHaveBeenCalledWith('test@example.com', 'Test User');
      expect(console.info).toHaveBeenCalledWith('Created user, id: user-123, name: Test User, email: test@example.com');
    });

    it('should handle invalid JSON gracefully', async () => {
      const mockEvent: SNSEvent = {
        Records: [
          {
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
              UnsubscribeUrl: 'test-unsubscribe-url',
              MessageAttributes: {},
            },
          },
        ],
      };

      await processUserRegistration(mockEvent);

      expect(vi.mocked(createUser)).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to process user registration record:',
        expect.objectContaining({
          messageId: 'test-id',
          error: expect.stringContaining('Failed to parse JSON'),
        })
      );
    });

    it('should handle schema validation errors gracefully', async () => {
      const mockEvent: SNSEvent = {
        Records: [
          {
            EventSource: 'aws:sns',
            EventVersion: '1.0',
            EventSubscriptionArn: 'test-arn',
            Sns: {
              Type: 'Notification',
              MessageId: 'test-id',
              TopicArn: 'test-topic-arn',
              Subject: 'test',
              Message: JSON.stringify({ email: 'invalid-email', name: 'Test User' }),
              Timestamp: '2023-01-01T00:00:00.000Z',
              SignatureVersion: '1',
              Signature: 'test-signature',
              SigningCertUrl: 'test-cert-url',
              UnsubscribeUrl: 'test-unsubscribe-url',
              MessageAttributes: {},
            },
          },
        ],
      };

      await processUserRegistration(mockEvent);

      expect(vi.mocked(createUser)).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to process user registration record:',
        expect.objectContaining({
          messageId: 'test-id',
          error: expect.stringContaining('Failed to validate SNS message against schema'),
        })
      );
    });
  });

  describe('processBoardCreation', () => {
    it('should successfully process valid board creation', async () => {
      const mockEvent: SQSEvent = {
        Records: [
          {
            messageId: 'test-id',
            receiptHandle: 'test-handle',
            body: JSON.stringify({ name: 'Test Board', createdBy: 'user-123' }),
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
          },
        ],
      };

      vi.mocked(createBoard).mockResolvedValueOnce('board-456');

      await processBoardCreation(mockEvent);

      expect(vi.mocked(createBoard)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(createBoard)).toHaveBeenCalledWith('Test Board', 'user-123');
      expect(console.info).toHaveBeenCalledWith('Created board, id: board-456, name: Test Board, createdBy: user-123');
    });

    it('should handle invalid JSON gracefully', async () => {
      const mockEvent: SQSEvent = {
        Records: [
          {
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
          },
        ],
      };

      await processBoardCreation(mockEvent);

      expect(vi.mocked(createBoard)).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to process board creation record:',
        expect.objectContaining({
          messageId: 'test-id',
          error: expect.stringContaining('Failed to parse JSON'),
        })
      );
    });
  });

  describe('processMessagePosting', () => {
    it('should successfully process valid message posting', async () => {
      const mockEvent: SNSEvent = {
        Records: [
          {
            EventSource: 'aws:sns',
            EventVersion: '1.0',
            EventSubscriptionArn: 'test-arn',
            Sns: {
              Type: 'Notification',
              MessageId: 'test-id',
              TopicArn: 'test-topic-arn',
              Subject: 'test',
              Message: JSON.stringify({
                topic: 'Test Topic',
                data: 'Test message data',
                boardId: 'board-123',
                userId: 'user-456',
              }),
              Timestamp: '2023-01-01T00:00:00.000Z',
              SignatureVersion: '1',
              Signature: 'test-signature',
              SigningCertUrl: 'test-cert-url',
              UnsubscribeUrl: 'test-unsubscribe-url',
              MessageAttributes: {},
            },
          },
        ],
      };

      vi.mocked(createMessage).mockResolvedValueOnce('message-789');

      await processMessagePosting(mockEvent);

      expect(vi.mocked(createMessage)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(createMessage)).toHaveBeenCalledWith('Test Topic', 'Test message data', 'board-123', 'user-456');
      expect(console.info).toHaveBeenCalledWith(
        'Created message, id: message-789, topic: Test Topic, boardId: board-123, userId: user-456'
      );
    });

    it('should handle service errors gracefully', async () => {
      const mockEvent: SNSEvent = {
        Records: [
          {
            EventSource: 'aws:sns',
            EventVersion: '1.0',
            EventSubscriptionArn: 'test-arn',
            Sns: {
              Type: 'Notification',
              MessageId: 'test-id',
              TopicArn: 'test-topic-arn',
              Subject: 'test',
              Message: JSON.stringify({
                topic: 'Test Topic',
                data: 'Test message data',
                boardId: 'board-123',
                userId: 'user-456',
              }),
              Timestamp: '2023-01-01T00:00:00.000Z',
              SignatureVersion: '1',
              Signature: 'test-signature',
              SigningCertUrl: 'test-cert-url',
              UnsubscribeUrl: 'test-unsubscribe-url',
              MessageAttributes: {},
            },
          },
        ],
      };

      vi.mocked(createMessage).mockRejectedValueOnce(new Error('Database error'));

      await processMessagePosting(mockEvent);

      expect(vi.mocked(createMessage)).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to process message posting record:',
        expect.objectContaining({
          messageId: 'test-id',
          error: 'Database error',
        })
      );
    });
  });

  describe('error reporting and statistics', () => {
    it('should report correct statistics for mixed success/failure', async () => {
      const mockEvent: SNSEvent = {
        Records: [
          {
            EventSource: 'aws:sns',
            EventVersion: '1.0',
            EventSubscriptionArn: 'test-arn',
            Sns: {
              Type: 'Notification',
              MessageId: 'success-id',
              TopicArn: 'test-topic-arn',
              Subject: 'test',
              Message: JSON.stringify({ email: 'test@example.com', name: 'Test User' }),
              Timestamp: '2023-01-01T00:00:00.000Z',
              SignatureVersion: '1',
              Signature: 'test-signature',
              SigningCertUrl: 'test-cert-url',
              UnsubscribeUrl: 'test-unsubscribe-url',
              MessageAttributes: {},
            },
          },
          {
            EventSource: 'aws:sns',
            EventVersion: '1.0',
            EventSubscriptionArn: 'test-arn',
            Sns: {
              Type: 'Notification',
              MessageId: 'failure-id',
              TopicArn: 'test-topic-arn',
              Subject: 'test',
              Message: 'invalid-json',
              Timestamp: '2023-01-01T00:00:00.000Z',
              SignatureVersion: '1',
              Signature: 'test-signature',
              SigningCertUrl: 'test-cert-url',
              UnsubscribeUrl: 'test-unsubscribe-url',
              MessageAttributes: {},
            },
          },
        ],
      };

      vi.mocked(createUser).mockResolvedValueOnce('user-123');

      await processUserRegistration(mockEvent);

      expect(console.info).toHaveBeenCalledWith('Processed 2 user registration requests: 1 successful, 1 failed');
    });
  });
});
