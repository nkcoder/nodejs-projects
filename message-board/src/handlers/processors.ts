import type { SNSEvent, SQSEvent } from 'aws-lambda';
import { registerUserSchema } from '../schema/userSchema';
import { createBoardSchema } from '../schema/boardSchema';
import { createUser } from '../services/userService';
import { createBoard } from '../services/boardService';

export const processUserRegistration = async (event: SNSEvent): Promise<void> => {
  console.info(`Received user registration requests: ${JSON.stringify(event)}`);

  const recordPromises = event.Records.map(async record => {
    const message = JSON.parse(record.Sns.Message) as unknown;
    const registerRequest = registerUserSchema.parse(message);
    const id = await createUser(registerRequest.email, registerRequest.name);
    console.info(`Created user, id: ${id}, name: ${registerRequest.name}, email: ${registerRequest.email}`);
  });

  await Promise.all(recordPromises);

  console.info(`Processed ${event.Records.length} user registration requests.`);
};

export const processBoardCreation = async (event: SQSEvent): Promise<void> => {
  console.info(`Received board creation requests: ${JSON.stringify(event)}`);

  const recordPromises = event.Records.map(async record => {
    const message = JSON.parse(record.body) as unknown;
    const createRequest = createBoardSchema.parse(message);
    const id = await createBoard(createRequest.name, createRequest.createdBy);
    console.info(`Created board, id: ${id}, name: ${createRequest.name}, createdBy: ${createRequest.createdBy}`);
  });

  await Promise.all(recordPromises);

  console.info(`Processed ${event.Records.length} board creation requests.`);
};

export const processMessagePosting = (event: SNSEvent): void => {
  console.info(`Received message posting requests: ${JSON.stringify(event)}`);
  // TODO: Implement message posting processor
  console.info(`Processed ${event.Records.length} message posting requests.`);
};
