import { PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { boardSchema, type Board } from '../schema/boardSchema';
import { dynamoDbClient } from './aws';
import { generateId } from './idGenerator';

export const createBoard = async (name: string, createdBy: string): Promise<string> => {
  const id = generateId();
  const db = dynamoDbClient();
  await db.send(
    new PutCommand({
      TableName: process.env.BOARDS_TABLE,
      Item: {
        id,
        name,
        createdBy,
        createdAt: new Date().toISOString(),
      },
    })
  );
  return id;
};

export const listBoards = async (): Promise<Board[]> => {
  const db = dynamoDbClient();
  const result = await db.send(
    new ScanCommand({
      TableName: process.env.BOARDS_TABLE,
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return [];
  }

  return result.Items.map(item => boardSchema.parse(item));
};
