import { PublishCommand } from '@aws-sdk/client-sns';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { postMessageSchema } from '../schema/messageSchema';
import { validateBoardIdParam } from '../schema/pathParamsSchema';
import { snsClient } from '../services/aws';
import * as messageService from '../services/messageService';
import {
  withErrorHandling,
  validateRequestBody,
  parseRequestBody,
  getPathParameter,
  createSuccessResponse,
  createAcceptedResponse,
  ApiError,
} from '../utils/apiHelpers';

const handlePostMessage = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const boardId = getPathParameter(event, 'boardId');
  const validatedBoardId = validateBoardIdParam(boardId);

  // Parse and validate the request body, then add boardId
  const requestBody = parseRequestBody(event.body);
  const postRequest = postMessageSchema.parse({
    ...(requestBody as Record<string, unknown>),
    boardId: validatedBoardId,
  });

  // send message posting event to SNS
  const topicArn = process.env.MESSAGE_POSTING_TOPIC_ARN;
  if (!topicArn) {
    throw new ApiError(500, 'Message posting topic not configured');
  }

  const command = new PublishCommand({
    TopicArn: topicArn,
    Message: JSON.stringify(postRequest),
  });

  await snsClient().send(command);

  return createAcceptedResponse('Message posting request is accepted.');
};

const handleListMessages = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const boardId = getPathParameter(event, 'boardId');
  const validatedBoardId = validateBoardIdParam(boardId);

  const messages = await messageService.getMessagesByBoardId(validatedBoardId);
  return createSuccessResponse(messages);
};

export const postMessage = withErrorHandling('postMessage', handlePostMessage);
export const listMessages = withErrorHandling('listMessages', handleListMessages);
