import { PublishCommand } from '@aws-sdk/client-sns';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { registerUserSchema } from '../schema/userSchema';
import { validateEmailParam } from '../schema/pathParamsSchema';
import { snsClient } from '../services/aws';
import * as userService from '../services/userService';
import {
  withErrorHandling,
  validateRequestBody,
  getPathParameter,
  createSuccessResponse,
  createAcceptedResponse,
  ApiError,
} from '../utils/apiHelpers';

const handleRegisterUser = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const registerRequest = validateRequestBody(event.body, registerUserSchema);

  // send user registration event to SNS
  const topicArn = process.env.USER_REGISTRATION_TOPIC_ARN;
  if (!topicArn) {
    throw new ApiError(500, 'User registration topic not configured');
  }

  const command = new PublishCommand({
    TopicArn: topicArn,
    Message: JSON.stringify(registerRequest),
  });

  await snsClient().send(command);

  return createAcceptedResponse('User registration request is accepted.');
};

const handleGetUserByEmail = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const email = getPathParameter(event, 'email');
  const validatedEmail = validateEmailParam(email);

  const user = await userService.getUserByEmail(validatedEmail);
  if (user === null) {
    throw new ApiError(404, `User with email ${validatedEmail} not found`);
  }

  return createSuccessResponse(user);
};

export const registerUser = withErrorHandling('registerUser', handleRegisterUser);
export const getUserByEmail = withErrorHandling('getUserByEmail', handleGetUserByEmail);
