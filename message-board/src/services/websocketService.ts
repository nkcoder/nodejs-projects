import { PutCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { websocketConnectionSchema, type WebSocketConnection, type BroadcastMessage } from '../schema/websocketSchema';
import { dynamoDbClient } from './aws';

/**
 * Get API Gateway Management API client for WebSocket connections
 */
export function getApiGatewayClient(domainName?: string, stage?: string): ApiGatewayManagementApiClient | null {
  if (domainName && stage) {
    return new ApiGatewayManagementApiClient({
      endpoint: `https://${domainName}/${stage}`,
      region: process.env.REGION,
    });
  } else if (process.env.WEBSOCKET_API_ENDPOINT) {
    // Use environment variable if available (for processors)
    return new ApiGatewayManagementApiClient({
      endpoint: process.env.WEBSOCKET_API_ENDPOINT,
      region: process.env.REGION,
    });
  }
  return null;
}

/**
 * Store a WebSocket connection in DynamoDB
 */
export async function storeConnection(connectionId: string, boardId?: string, userId?: string): Promise<void> {
  const db = dynamoDbClient();
  await db.send(
    new PutCommand({
      TableName: process.env.WEBSOCKET_CONNECTIONS_TABLE,
      Item: {
        connectionId,
        boardId,
        userId,
        connectedAt: new Date().toISOString(),
      },
    })
  );
}

/**
 * Remove a WebSocket connection from DynamoDB
 */
export async function removeConnection(connectionId: string): Promise<void> {
  const db = dynamoDbClient();
  await db.send(
    new DeleteCommand({
      TableName: process.env.WEBSOCKET_CONNECTIONS_TABLE,
      Key: {
        connectionId,
      },
    })
  );
}

/**
 * Subscribe a connection to a board
 */
export async function subscribeToBoard(connectionId: string, boardId: string, userId?: string): Promise<void> {
  const db = dynamoDbClient();
  await db.send(
    new PutCommand({
      TableName: process.env.WEBSOCKET_CONNECTIONS_TABLE,
      Item: {
        connectionId,
        boardId,
        userId,
        connectedAt: new Date().toISOString(),
      },
    })
  );
}

/**
 * Get all connections subscribed to a board
 */
export async function getConnectionsByBoardId(boardId: string): Promise<WebSocketConnection[]> {
  const db = dynamoDbClient();
  const result = await db.send(
    new QueryCommand({
      TableName: process.env.WEBSOCKET_CONNECTIONS_TABLE,
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

  return result.Items.map(item => websocketConnectionSchema.parse(item));
}

/**
 * Send a message to a specific WebSocket connection
 */
export async function sendToConnection(
  connectionId: string,
  message: object,
  apiGatewayClient: ApiGatewayManagementApiClient | null
): Promise<void> {
  if (!apiGatewayClient) {
    console.error('API Gateway client not initialized');
    return;
  }

  try {
    await apiGatewayClient.send(
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: JSON.stringify(message),
      })
    );
    console.info(`Message sent to connection ${connectionId}`);
  } catch (error) {
    console.error(`Failed to send message to connection ${connectionId}:`, error);

    // If the connection is stale (410 error), remove it from the database
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 410) {
      console.info(`Removing stale connection ${connectionId}`);
      await removeConnection(connectionId);
    }
    throw error;
  }
}

/**
 * Broadcast a message to all connections subscribed to a board
 */
export async function broadcastToBoard(
  boardId: string,
  message: BroadcastMessage,
  apiGatewayClient?: ApiGatewayManagementApiClient | null
): Promise<void> {
  const connections = await getConnectionsByBoardId(boardId);

  if (connections.length === 0) {
    console.info(`No connections found for board ${boardId}`);
    return;
  }

  // If no client provided, try to create one from environment
  const client = apiGatewayClient ?? getApiGatewayClient();

  if (!client) {
    console.warn('API Gateway client not initialized, skipping WebSocket broadcast');
    return;
  }

  const broadcastPromises = connections.map(async connection => {
    try {
      await client.send(
        new PostToConnectionCommand({
          ConnectionId: connection.connectionId,
          Data: JSON.stringify(message),
        })
      );
      console.info(`Message sent to connection ${connection.connectionId}`);
    } catch (error) {
      console.error(`Failed to send message to connection ${connection.connectionId}:`, error);

      // If the connection is stale (410 error), remove it from the database
      if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 410) {
        console.info(`Removing stale connection ${connection.connectionId}`);
        await removeConnection(connection.connectionId);
      }
    }
  });

  await Promise.allSettled(broadcastPromises);
}
