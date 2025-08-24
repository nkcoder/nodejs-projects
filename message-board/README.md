## Message Board

A simple async API where users can register, create boards, post messages to boards and request messages. It's implemented using serverless and event driven architecture with real-time subscription support via WebSockets.

## System Design

![System Design](./doc/diagram.png)

## Subscription System Design

The Message Board includes a real-time subscription system that allows users to receive instant notifications when new messages are posted to boards they're interested in. This system is built using AWS WebSocket API Gateway and DynamoDB for connection management.

### Overview

The subscription system enables real-time messaging through WebSocket connections, allowing users to:
- Subscribe to specific message boards
- Receive real-time notifications when new messages are posted
- Manage multiple subscriptions simultaneously
- Automatically handle connection cleanup

### Architecture Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WebSocket     │    │   REST API      │    │   Message       │
│   Client        │◄──►│   Gateway       │◄──►│   Processing    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WebSocket     │    │   HTTP Lambda   │    │   SNS Topic     │
│   Lambda        │    │   Functions     │    │   (Messages)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                                              │
         │              ┌─────────────────┐            │
         └──────────────►│   DynamoDB      │◄───────────┘
                        │   (Connections) │
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │   Broadcast     │
                        │   Lambda        │
                        └─────────────────┘
```

### Database Design

#### WebSocket Connections Table

The WebSocket connections are managed in a dedicated DynamoDB table:

**Table Name**: `websocket-connections-table-{stage}`

**Schema**:
```typescript
{
  connectionId: string (Primary Key)    // Unique WebSocket connection identifier
  boardId?: string (GSI)               // Board the connection is subscribed to
  userId?: string                      // Optional user identifier
  connectedAt: string                  // ISO timestamp when connection was established
}
```

**Indexes**:
- **Primary Key**: `connectionId` - Direct connection lookup
- **GSI**: `boardId-index` - Query all connections subscribed to a specific board

**Example Records**:
```json
[
  {
    "connectionId": "conn_abc123",
    "boardId": "board_456",
    "userId": "user_789",
    "connectedAt": "2023-12-01T15:30:00.000Z"
  },
  {
    "connectionId": "conn_def456",
    "boardId": "board_456",
    "userId": "user_101",
    "connectedAt": "2023-12-01T15:31:00.000Z"
  }
]
```

### Workflow

#### 1. Connection Establishment

```mermaid
sequenceDiagram
    participant Client
    participant API Gateway
    participant Connect Lambda
    participant DynamoDB

    Client->>API Gateway: WebSocket Connect
    API Gateway->>Connect Lambda: $connect event
    Connect Lambda->>DynamoDB: Store connection
    Connect Lambda->>API Gateway: Success response
    API Gateway->>Client: Connection established
```

**Process**:
1. Client initiates WebSocket connection to API Gateway
2. API Gateway triggers `websocketConnect` Lambda function
3. Lambda stores connection ID in DynamoDB (without board subscription initially)
4. Connection is established and ready for subscription requests

#### 2. Board Subscription

```mermaid
sequenceDiagram
    participant Client
    participant API Gateway
    participant Subscribe Lambda
    participant DynamoDB

    Client->>API Gateway: Subscribe message
    API Gateway->>Subscribe Lambda: WebSocket message
    Subscribe Lambda->>DynamoDB: Update connection with boardId
    Subscribe Lambda->>Client: Subscription confirmation
```

**Process**:
1. Client sends subscription message: `{"action": "subscribe", "boardId": "board_123", "userId": "user_456"}`
2. API Gateway routes message to `websocketSubscribe` Lambda function
3. Lambda validates message format using Zod schema
4. Lambda updates DynamoDB record with `boardId` to establish subscription
5. Lambda sends confirmation back to client

**Message Format**:
```typescript
{
  action: "subscribe",
  boardId: string,      // Required: Board to subscribe to
  userId?: string       // Optional: User making subscription
}
```

#### 3. Message Broadcasting

```mermaid
sequenceDiagram
    participant REST API
    participant SNS Topic
    participant Process Lambda
    participant DynamoDB (Messages)
    participant DynamoDB (Connections)
    participant API Gateway
    participant Subscribers

    REST API->>SNS Topic: Publish message event
    SNS Topic->>Process Lambda: Message posting event
    Process Lambda->>DynamoDB (Messages): Store message
    Process Lambda->>DynamoDB (Connections): Query subscribers
    Process Lambda->>API Gateway: Broadcast to connections
    API Gateway->>Subscribers: Real-time message delivery
```

**Process**:
1. Message is posted via REST API (`POST /boards/{boardId}/messages`)
2. REST API publishes event to SNS topic
3. `processMessagePosting` Lambda function processes the event
4. Lambda stores message in DynamoDB messages table
5. Lambda queries connections table for all subscriptions to the board
6. Lambda broadcasts message to all connected subscribers via API Gateway WebSocket API
7. Subscribers receive real-time message notification

**Broadcast Message Format**:
```typescript
{
  type: "message",
  boardId: string,
  message: {
    id: string,
    topic: string,
    data: string,
    boardId: string,
    userId: string,
    createdAt: string
  }
}
```

#### 4. Connection Cleanup

```mermaid
sequenceDiagram
    participant Client
    participant API Gateway
    participant Disconnect Lambda
    participant DynamoDB

    Client->>API Gateway: WebSocket Disconnect
    API Gateway->>Disconnect Lambda: $disconnect event
    Disconnect Lambda->>DynamoDB: Remove connection
```

**Process**:
1. Client disconnects (intentionally or due to network issues)
2. API Gateway triggers `websocketDisconnect` Lambda function
3. Lambda removes connection record from DynamoDB
4. Stale connections are automatically cleaned up when broadcast attempts fail

### Error Handling and Resilience

#### Stale Connection Management

The system automatically handles stale connections:

```typescript
// In websocketService.broadcastToBoard()
try {
  await client.send(new PostToConnectionCommand({
    ConnectionId: connection.connectionId,
    Data: JSON.stringify(message)
  }));
} catch (error) {
  // If connection is stale (410 error), remove it
  if (error?.statusCode === 410) {
    console.info(`Removing stale connection ${connection.connectionId}`);
    await removeConnection(connection.connectionId);
  }
}
```

#### Fault Tolerance

- **Message Processing**: Uses `Promise.allSettled()` to ensure all subscribers receive messages even if some fail
- **Connection Failures**: Failed connections are logged but don't prevent other subscribers from receiving messages
- **Data Consistency**: Connection state is eventually consistent through DynamoDB
- **Retry Logic**: AWS services provide built-in retry mechanisms for transient failures

### Scalability Characteristics

#### DynamoDB Scaling
- **On-Demand Billing**: Automatically scales read/write capacity
- **Global Secondary Index**: Efficient querying by `boardId` for broadcast operations
- **Eventually Consistent**: Optimized for high-throughput scenarios

#### Lambda Concurrency
- **WebSocket Handlers**: Scale automatically with connection volume
- **Broadcast Processing**: Parallel execution for multiple board subscriptions
- **Memory Optimization**: Functions use appropriate memory allocation for their workload

#### Connection Limits
- **API Gateway**: Supports up to 100,000 concurrent connections per region
- **Lambda Duration**: WebSocket functions have 15-minute maximum execution time
- **Broadcast Fan-out**: Efficient parallel broadcasting to multiple connections

### Monitoring and Observability

#### Key Metrics
- **Active Connections**: Number of concurrent WebSocket connections
- **Subscription Rate**: New subscriptions per minute
- **Message Broadcast Rate**: Messages broadcasted per minute
- **Connection Cleanup Rate**: Stale connections removed per minute

#### Logging
- **Connection Events**: All connect/disconnect/subscribe events are logged
- **Broadcast Results**: Success/failure of message broadcasts to individual connections
- **Error Tracking**: Failed broadcasts and connection errors are tracked

### Security Considerations

#### Connection Authentication
- Currently no authentication required (development mode)
- Production should implement JWT-based authentication
- Connection metadata can include user identification

#### Data Validation
- All WebSocket messages validated using Zod schemas
- Input sanitization prevents injection attacks
- Connection state isolated per connection

#### Network Security
- HTTPS/WSS in production environments
- API Gateway provides DDoS protection
- Lambda functions run in isolated execution environments

### Development and Testing

#### Local Development
```bash
# Start WebSocket API locally
npm run offline

# WebSocket URL: ws://localhost:3001
```

#### Testing WebSocket Connections
```bash
# Install wscat for testing
npm install -g wscat

# Connect to local WebSocket
wscat -c ws://localhost:3001

# Send subscription message
{"action": "subscribe", "boardId": "test-board", "userId": "test-user"}

# Send unsubscription message
{"action": "unsubscribe", "boardId": "test-board"}
```

The subscription system provides a robust, scalable foundation for real-time messaging while maintaining the event-driven architecture principles of the overall Message Board application.

## Usage

### Deployment

Install dependencies with:

```
npm install
```

and then deploy with:

```
npm run deploy
```

After running deploy, you should see output similar to:

```
❯ sls deploy --stage dev

Deploying "message-board" to stage "dev" (ap-southeast-2)

✔ Service deployed to stack message-board-dev (54s)

endpoints:
  POST - https://bz89bd7xv5.execute-api.ap-southeast-2.amazonaws.com/users/register
  GET - https://bz89bd7xv5.execute-api.ap-southeast-2.amazonaws.com/users/{email}
  GET - https://bz89bd7xv5.execute-api.ap-southeast-2.amazonaws.com/boards
  POST - https://bz89bd7xv5.execute-api.ap-southeast-2.amazonaws.com/boards
  POST - https://bz89bd7xv5.execute-api.ap-southeast-2.amazonaws.com/boards/{boardId}/messages
functions:
  registerUser: message-board-dev-registerUser (394 kB)
  getUserByEmail: message-board-dev-getUserByEmail (394 kB)
  listBoards: message-board-dev-listBoards (394 kB)
  createBoard: message-board-dev-createBoard (394 kB)
  postMessage: message-board-dev-postMessage (394 kB)
  processUserRegistration: message-board-dev-processUserRegistration (394 kB)
  processBoardCreation: message-board-dev-processBoardCreation (394 kB)
  processMessagePosting: message-board-dev-processMessagePosting (394 kB)
```

### Invocation

After successful deployment, you can create a new user by calling the corresponding endpoint:

```sh
❯ curl -X POST --header 'Content-Type: application/json' -d '{"email": "test1@test.com", "name": "Test 1"}' https://bz89bd7xv5.execute-api.ap-southeast-2.amazonaws.com/users/register
{"message":"User registration request is accepted."}%  
```

### Local development

The easiest way to develop and test your function is to use the `dev` command:

```sh
npm run dev
```

This will start a local emulator of AWS Lambda and tunnel your requests to and from AWS Lambda, allowing you to interact with your function as if it were running in the cloud.

Now you can invoke the function as before, but this time the function will be executed locally. Now you can develop your function locally, invoke it, and see the results immediately without having to re-deploy.

When you are done developing, don't forget to run `serverless deploy` to deploy the function to the cloud.

## Testing

### Unit Testing

It is possible and should cover the coverage threshold, update source code to be more testable if required.

We should integrate automatic testing into CI/CD pipeline.

```sh
❯ npm run test

> message-board@1.0.0 test
> vitest run


 RUN  v3.2.4 /Users/ling/projects/playground/message-board

....

 ✓ test/handlers/user.test.ts (10 tests) 6ms

 Test Files  2 passed (2)
      Tests  13 passed (13)
   Start at  08:06:01
   Duration  388ms (transform 62ms, setup 0ms, collect 246ms, tests 10ms, environment 0ms, prepare 111ms)
```

### Integration Testing (automatic)

It is a bit difficult as it involves AWS resources, but I might be wrong.

### Manual Testing

Run the application locally or deploy to dev for end-to-end testing.

Local testing:

```sh
npm run offline
npm run dev
```

Dev testing:

```sh
npm run deploy --stage dev
```
