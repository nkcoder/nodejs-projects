import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { SNSClient } from '@aws-sdk/client-sns';
import { SQSClient } from '@aws-sdk/client-sqs';
import { DynamoDBDocument, type DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const region = process.env.AWS_REGION ?? 'ap-southeast-2';

// SNS client
export const snsClient = (): SNSClient => new SNSClient({ region });

// SQS client
export const sqsClient = (): SQSClient => new SQSClient({ region });

// DynamoDB client
export const dynamoDbClient = (): DynamoDBDocumentClient => {
  const client = new DynamoDBClient({ region });
  return DynamoDBDocument.from(client);
};
