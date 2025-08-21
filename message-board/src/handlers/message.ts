import { PublishCommand } from '@aws-sdk/client-sns';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { postMessageSchema } from '../schema/messageSchema';
import { snsClient } from '../services/aws';

export const postMessage = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.info(`Received message posting request: ${event.body}`);

  // Get boardId from path parameters
  const boardId = event.pathParameters?.boardId;

  if (boardId == null || boardId === '') {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Board ID parameter is required' }),
    };
  }

  // Parse and validate the request body
  const requestBody = JSON.parse(event.body ?? '{}');
  const postRequest = postMessageSchema.parse({
    ...requestBody,
    boardId, // Add boardId from path parameter
  });

  // send message posting event to SNS
  const topicArn = process.env.MESSAGE_POSTING_TOPIC_ARN;
  const command = new PublishCommand({
    TopicArn: topicArn,
    Message: JSON.stringify(postRequest),
  });
  await snsClient().send(command);
  console.info(`Sent message posting request to SNS: ${topicArn}.`);

  return {
    statusCode: 202, // Accepted, but not processed completely
    body: JSON.stringify({ message: 'Message posting request is accepted.' }),
  };
};
