import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { userSchema, type User } from '../schema/userSchema';
import { dynamoDbClient } from './aws';
import { generateId } from './idGenerator';

export const createUser = async (email: string, name: string): Promise<string> => {
  const existingUser = await getUserByEmail(email);
  if (existingUser !== null) {
    throw new Error(`User with email ${email} already exists`);
  }

  const id = generateId();
  const db = dynamoDbClient();
  await db.send(
    new PutCommand({
      TableName: process.env.USERS_TABLE,
      Item: {
        id,
        email,
        name,
        createdAt: new Date().toISOString(),
      },
    })
  );
  return id;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const db = dynamoDbClient();
  const result = await db.send(
    new QueryCommand({
      TableName: process.env.USERS_TABLE,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return null;
  }

  console.log(`result: ${JSON.stringify(result.Items[0])}`);
  return userSchema.parse(result.Items[0]);
};
