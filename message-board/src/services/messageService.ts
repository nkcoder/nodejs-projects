import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { messageSchema, type Message } from '../schema/messageSchema';
import { dynamoDbClient } from './aws';
import { generateId } from './idGenerator';

export const createMessage = async (topic: string, data: string, boardId: string, userId: string): Promise<string> => {
  const id = generateId();
  const db = dynamoDbClient();
  await db.send(
    new PutCommand({
      TableName: process.env.MESSAGES_TABLE,
      Item: {
        id,
        topic,
        data,
        boardId,
        userId,
        createdAt: new Date().toISOString(),
      },
    })
  );
  return id;
};

export const getMessagesByBoardId = async (boardId: string): Promise<Message[]> => {
  const db = dynamoDbClient();
  const result = await db.send(
    new QueryCommand({
      TableName: process.env.MESSAGES_TABLE,
      IndexName: 'boardId-index',
      KeyConditionExpression: 'boardId = :boardId',
      ExpressionAttributeValues: {
        ':boardId': boardId,
      },
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return [];
  }

  return result.Items.map(item => messageSchema.parse(item));
};
