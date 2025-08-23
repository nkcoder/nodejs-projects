import type { SNSEvent, SQSEvent } from 'aws-lambda';
import { registerUserSchema } from '../schema/userSchema';
import { createBoardSchema } from '../schema/boardSchema';
import { postMessageSchema } from '../schema/messageSchema';
import { createUser } from '../services/userService';
import { createBoard } from '../services/boardService';
import { createMessage } from '../services/messageService';
import * as websocketService from '../services/websocketService';
import { parseSnsMessage, parseSqsMessage, MessageParsingError } from '../utils/messageParser';

export const processUserRegistration = async (event: SNSEvent): Promise<void> => {
  console.info(`Received user registration requests: ${JSON.stringify(event)}`);

  const results = await Promise.allSettled(
    event.Records.map(async record => {
      try {
        const registerRequest = parseSnsMessage(record, registerUserSchema);
        const id = await createUser(registerRequest.email, registerRequest.name);
        console.info(`Created user, id: ${id}, name: ${registerRequest.name}, email: ${registerRequest.email}`);
        return { success: true, id };
      } catch (error) {
        console.error(`Failed to process user registration record:`, {
          messageId: record.Sns.MessageId,
          error: error instanceof Error ? error.message : String(error),
          cause: error instanceof MessageParsingError ? error.cause?.message : undefined,
        });
        return { success: false, error };
      }
    })
  );

  const successful = results.filter(result => result.status === 'fulfilled' && result.value.success).length;
  const failed = results.length - successful;

  console.info(
    `Processed ${event.Records.length} user registration requests: ${successful} successful, ${failed} failed`
  );
};

export const processBoardCreation = async (event: SQSEvent): Promise<void> => {
  console.info(`Received board creation requests: ${JSON.stringify(event)}`);

  const results = await Promise.allSettled(
    event.Records.map(async record => {
      try {
        const createRequest = parseSqsMessage(record, createBoardSchema);
        const id = await createBoard(createRequest.name, createRequest.createdBy);
        console.info(`Created board, id: ${id}, name: ${createRequest.name}, createdBy: ${createRequest.createdBy}`);
        return { success: true, id };
      } catch (error) {
        console.error(`Failed to process board creation record:`, {
          messageId: record.messageId,
          error: error instanceof Error ? error.message : String(error),
          cause: error instanceof MessageParsingError ? error.cause?.message : undefined,
        });
        return { success: false, error };
      }
    })
  );

  const successful = results.filter(result => result.status === 'fulfilled' && result.value.success).length;
  const failed = results.length - successful;

  console.info(`Processed ${event.Records.length} board creation requests: ${successful} successful, ${failed} failed`);
};

export const processMessagePosting = async (event: SNSEvent): Promise<void> => {
  console.info(`Received message posting requests: ${JSON.stringify(event)}`);

  const results = await Promise.allSettled(
    event.Records.map(async record => {
      try {
        const postRequest = parseSnsMessage(record, postMessageSchema);
        const messageId = await createMessage(
          postRequest.topic,
          postRequest.data,
          postRequest.boardId,
          postRequest.userId
        );

        console.info(
          `Created message, id: ${messageId}, topic: ${postRequest.topic}, boardId: ${postRequest.boardId}, userId: ${postRequest.userId}`
        );

        // Create the message object for broadcasting
        const broadcastMessage = {
          type: 'message' as const,
          boardId: postRequest.boardId,
          message: {
            id: messageId,
            topic: postRequest.topic,
            data: postRequest.data,
            boardId: postRequest.boardId,
            userId: postRequest.userId,
            createdAt: new Date().toISOString(),
          },
        };

        // Broadcast to WebSocket subscribers
        try {
          await websocketService.broadcastToBoard(postRequest.boardId, broadcastMessage);
          console.info(`Broadcasted message ${messageId} to WebSocket subscribers of board ${postRequest.boardId}`);
        } catch (error) {
          console.error(`Failed to broadcast message ${messageId} to WebSocket subscribers:`, error);
          // Don't fail the entire operation if WebSocket broadcast fails
        }

        return { success: true, id: messageId };
      } catch (error) {
        console.error(`Failed to process message posting record:`, {
          messageId: record.Sns.MessageId,
          error: error instanceof Error ? error.message : String(error),
          cause: error instanceof MessageParsingError ? error.cause?.message : undefined,
        });
        return { success: false, error };
      }
    })
  );

  const successful = results.filter(result => result.status === 'fulfilled' && result.value.success).length;
  const failed = results.length - successful;

  console.info(
    `Processed ${event.Records.length} message posting requests: ${successful} successful, ${failed} failed`
  );
};
