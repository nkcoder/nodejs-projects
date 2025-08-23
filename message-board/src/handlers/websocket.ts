import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as websocketService from '../services/websocketService';
import { websocketMessageSchema, subscribeMessageSchema } from '../schema/websocketSchema';
import { withErrorHandling, createSuccessResponse, ApiError } from '../utils/apiHelpers';

const CONNECTION_ID_ERROR = 'Connection ID not found';

const handleConnect = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId;

  if (!connectionId) {
    throw new ApiError(400, CONNECTION_ID_ERROR);
  }

  console.info(`WebSocket connection established: ${connectionId}`);

  await websocketService.storeConnection(connectionId);

  return createSuccessResponse({ status: 'connected', connectionId });
};

const handleDisconnect = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId;

  if (!connectionId) {
    throw new ApiError(400, CONNECTION_ID_ERROR);
  }

  console.info(`WebSocket connection closed: ${connectionId}`);

  await websocketService.removeConnection(connectionId);

  return createSuccessResponse({ status: 'disconnected', connectionId });
};

const handleSubscribe = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId;

  if (!connectionId) {
    throw new ApiError(400, CONNECTION_ID_ERROR);
  }

  if (!event.body) {
    throw new ApiError(400, 'Request body is required');
  }

  let messageData;
  try {
    messageData = JSON.parse(event.body);
  } catch {
    throw new ApiError(400, 'Invalid JSON in request body');
  }

  // Validate the message format
  const validationResult = websocketMessageSchema.safeParse(messageData);
  if (!validationResult.success) {
    throw new ApiError(400, `Invalid message format: ${validationResult.error.message}`);
  }

  const message = validationResult.data;
  const domainName = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  const apiGatewayClient = websocketService.getApiGatewayClient(domainName, stage);

  if (message.action === 'subscribe') {
    const subscribeData = subscribeMessageSchema.parse(message);
    console.info(`Subscribing connection ${connectionId} to board ${subscribeData.boardId}`);

    await websocketService.subscribeToBoard(connectionId, subscribeData.boardId, subscribeData.userId);

    // Send confirmation back to the client
    await websocketService.sendToConnection(
      connectionId,
      {
        type: 'subscription_confirmed',
        boardId: subscribeData.boardId,
        connectionId,
      },
      apiGatewayClient
    );

    return createSuccessResponse({
      status: 'subscribed',
      boardId: subscribeData.boardId,
      connectionId,
    });
  }

  if (message.action === 'unsubscribe') {
    console.info(`Unsubscribing connection ${connectionId} from board ${message.boardId}`);

    // For unsubscribe, we simply remove the connection which will stop future broadcasts
    await websocketService.removeConnection(connectionId);

    // Re-add connection without board subscription
    await websocketService.storeConnection(connectionId);

    // Send confirmation back to the client
    await websocketService.sendToConnection(
      connectionId,
      {
        type: 'unsubscription_confirmed',
        boardId: message.boardId,
        connectionId,
      },
      apiGatewayClient
    );

    return createSuccessResponse({
      status: 'unsubscribed',
      boardId: message.boardId,
      connectionId,
    });
  }

  throw new ApiError(400, 'Unknown action');
};

// Export handlers with error handling wrapper
export const connect = withErrorHandling('websocketConnect', handleConnect);
export const disconnect = withErrorHandling('websocketDisconnect', handleDisconnect);
export const subscribe = withErrorHandling('websocketSubscribe', handleSubscribe);
