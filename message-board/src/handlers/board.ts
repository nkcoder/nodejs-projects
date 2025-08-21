import { SendMessageCommand } from '@aws-sdk/client-sqs';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createBoardSchema } from '../schema/boardSchema';
import { sqsClient } from '../services/aws';
import * as boardService from '../services/boardService';

export const createBoard = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.info(`Received board creation request: ${event.body}`);
  const createRequest = createBoardSchema.parse(JSON.parse(event.body ?? '{}'));

  // send board creation event to SQS
  const queueUrl = process.env.BOARD_CREATION_QUEUE_URL;
  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(createRequest),
  });
  await sqsClient().send(command);
  console.info(`Sent board creation request to SQS: ${queueUrl}.`);

  return {
    statusCode: 202, // Accepted, but not processed completely
    body: JSON.stringify({ message: 'Board creation request is accepted.' }),
  };
};

export const listBoards = async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.info('Received list boards request');

  const boards = await boardService.listBoards();

  return {
    statusCode: 200,
    body: JSON.stringify(boards),
  };
};
