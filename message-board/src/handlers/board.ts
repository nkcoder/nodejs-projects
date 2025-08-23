import { SendMessageCommand } from '@aws-sdk/client-sqs';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createBoardSchema } from '../schema/boardSchema';
import { sqsClient } from '../services/aws';
import * as boardService from '../services/boardService';
import {
  withErrorHandling,
  validateRequestBody,
  createSuccessResponse,
  createAcceptedResponse,
  ApiError,
} from '../utils/apiHelpers';

const handleCreateBoard = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const createRequest = validateRequestBody(event.body, createBoardSchema);

  // send board creation event to SQS
  const queueUrl = process.env.BOARD_CREATION_QUEUE_URL;
  if (!queueUrl) {
    throw new ApiError(500, 'Board creation queue not configured');
  }

  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(createRequest),
  });

  await sqsClient().send(command);

  return createAcceptedResponse('Board creation request is accepted.');
};

const handleListBoards = async (): Promise<APIGatewayProxyResult> => {
  const boards = await boardService.listBoards();
  return createSuccessResponse(boards);
};

export const createBoard = withErrorHandling('createBoard', handleCreateBoard);
export const listBoards = withErrorHandling('listBoards', handleListBoards);
