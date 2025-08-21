import { PublishCommand } from '@aws-sdk/client-sns';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { registerUserSchema } from '../schema/userSchema';
import { snsClient } from '../services/aws';
import * as userService from '../services/userService';

export const registerUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.info(`Received user registration request: ${event.body}`);
  const registerRequest = registerUserSchema.parse(JSON.parse(event.body ?? '{}'));

  // send user registration event to SNS
  const topicArn = process.env.USER_REGISTRATION_TOPIC_ARN;
  const command = new PublishCommand({
    TopicArn: topicArn,
    Message: JSON.stringify(registerRequest),
  });
  await snsClient().send(command);
  console.info(`Sent user registration request to SNS: ${topicArn}.`);

  return {
    statusCode: 202, // Accepted, but not processed completely
    body: JSON.stringify({ message: 'User registration request is accepted.' }),
  };
};

export const getUserByEmail = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.info(`Received fetch user by email request: ${event.pathParameters?.email}`);

  // Get email from path parameters
  const email = event.pathParameters?.email;

  if (email == null || email === '') {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Email parameter is required' }),
    };
  }

  // Decode URL-encoded email
  const decodedEmail = decodeURIComponent(email);

  // Validate email format (basic validation)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(decodedEmail)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid email format' }),
    };
  }

  const user = await userService.getUserByEmail(decodedEmail);
  if (user === null) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: `User with email ${decodedEmail} not found`,
      }),
    };
  }
  return {
    statusCode: 200,
    body: JSON.stringify(user),
  };
};
