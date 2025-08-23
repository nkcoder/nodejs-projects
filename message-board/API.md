# Message Board API Documentation

This document provides comprehensive API documentation for the Message Board application with ready-to-run examples using curl.

## Base URL

- **Local Development**: `http://localhost:3000`
- **Staging**: `https://{api-id}.execute-api.ap-southeast-2.amazonaws.com/dev`
- **Production**: `https://{api-id}.execute-api.ap-southeast-2.amazonaws.com/prod`

Replace `{api-id}` with your actual API Gateway ID.

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

## Content Type

All requests that include a body must use `Content-Type: application/json`.

## Response Format

All responses follow a consistent format:

### Success Response (2xx)

```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

### Error Response (4xx/5xx)

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400
  }
}
```

## User Endpoints

### 1. Register User

Registers a new user in the system. This is an asynchronous operation that returns immediately and processes the registration in the background.

**Endpoint**: `POST /users/register`

**Request Body**:

```json
{
  "email": "string (valid email)",
  "name": "string (2-30 characters)"
}
```

**Response**: `202 Accepted`

```json
{
  "success": true,
  "data": {
    "message": "User registration request is accepted."
  }
}
```

**Example**:

```bash
curl -X POST "http://localhost:3000/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "name": "John Doe"
  }'
```

**Validation Rules**:

- `email`: Must be a valid email format
- `name`: Must be 2-30 characters long

**Error Examples**:

```bash
# Invalid email format
curl -X POST "http://localhost:3000/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "name": "John Doe"
  }'

# Name too short
curl -X POST "http://localhost:3000/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "name": "A"
  }'

# Name too long
curl -X POST "http://localhost:3000/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "name": "'$(printf 'A%.0s' {1..31})'"
  }'
```

### 2. Get User by Email

Retrieves user information by email address.

**Endpoint**: `GET /users/{email}`

**Path Parameters**:

- `email`: Valid email address (URL encoded)

**Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "string",
    "email": "string",
    "name": "string",
    "createdAt": "ISO datetime string"
  }
}
```

**Example**:

```bash
curl -X GET "http://localhost:3000/users/john.doe@example.com"
```

**URL Encoding Example**:

```bash
# For emails with special characters like +
curl -X GET "http://localhost:3000/users/john.doe%2Btest@example.com"
```

**Error Responses**:

*User Not Found (404)*:

```json
{
  "success": false,
  "error": {
    "message": "User with email john.doe@example.com not found",
    "statusCode": 404
  }
}
```

*Invalid Email Format (400)*:

```json
{
  "success": false,
  "error": {
    "message": "Invalid email format",
    "statusCode": 400
  }
}
```

## Board Endpoints

### 3. List Boards

Retrieves all boards in the system.

**Endpoint**: `GET /boards`

**Response**: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "createdBy": "string",
      "createdAt": "ISO datetime string"
    }
  ]
}
```

**Example**:

```bash
curl -X GET "http://localhost:3000/boards"
```

**Example Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "board-123",
      "name": "General Discussion",
      "createdBy": "user-456",
      "createdAt": "2023-12-01T10:30:00.000Z"
    },
    {
      "id": "board-789",
      "name": "Tech Talk",
      "createdBy": "user-123",
      "createdAt": "2023-12-02T14:15:00.000Z"
    }
  ]
}
```

### 4. Create Board

Creates a new board. This is an asynchronous operation that returns immediately and processes the creation in the background.

**Endpoint**: `POST /boards`

**Request Body**:

```json
{
  "name": "string (2-100 characters)",
  "createdBy": "string (user ID)"
}
```

**Response**: `202 Accepted`

```json
{
  "success": true,
  "data": {
    "message": "Board creation request is accepted."
  }
}
```

**Example**:

```bash
curl -X POST "http://localhost:3000/boards" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Project Alpha Discussion",
    "createdBy": "user-123"
  }'
```

**Validation Rules**:

- `name`: Must be 2-100 characters long
- `createdBy`: Required string (user ID)

**Error Examples**:

```bash
# Board name too short
curl -X POST "http://localhost:3000/boards" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "A",
    "createdBy": "user-123"
  }'

# Board name too long
curl -X POST "http://localhost:3000/boards" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "'$(printf 'A%.0s' {1..101})'",
    "createdBy": "user-123"
  }'

# Missing createdBy
curl -X POST "http://localhost:3000/boards" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Board"
  }'
```

## Message Endpoints

### 5. Post Message

Posts a message to a specific board. This is an asynchronous operation that returns immediately and processes the message in the background.

**Endpoint**: `POST /boards/{boardId}/messages`

**Path Parameters**:

- `boardId`: Board ID where the message will be posted

**Request Body**:

```json
{
  "topic": "string (1-200 characters)",
  "data": "string (1-5000 characters)",
  "userId": "string (user ID)"
}
```

**Response**: `202 Accepted`

```json
{
  "success": true,
  "data": {
    "message": "Message posting request is accepted."
  }
}
```

**Example**:

```bash
curl -X POST "http://localhost:3000/boards/board-123/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Welcome to the board",
    "data": "This is my first message on this board. Looking forward to great discussions!",
    "userId": "user-456"
  }'
```

**Validation Rules**:

- `topic`: Must be 1-200 characters long
- `data`: Must be 1-5000 characters long
- `userId`: Required string (user ID)
- `boardId`: Required in URL path

**Error Examples**:

```bash
# Missing boardId in path
curl -X POST "http://localhost:3000/boards//messages" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Test Topic",
    "data": "Test message",
    "userId": "user-123"
  }'

# Topic too long
curl -X POST "http://localhost:3000/boards/board-123/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "'$(printf 'A%.0s' {1..201})'",
    "data": "Test message",
    "userId": "user-123"
  }'

# Data too long
curl -X POST "http://localhost:3000/boards/board-123/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Test Topic",
    "data": "'$(printf 'A%.0s' {1..5001})'",
    "userId": "user-123"
  }'

# Missing userId
curl -X POST "http://localhost:3000/boards/board-123/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Test Topic",
    "data": "Test message"
  }'
```

### 6. List Messages

Retrieves all messages from a specific board.

**Endpoint**: `GET /boards/{boardId}/messages`

**Path Parameters**:

- `boardId`: Board ID to retrieve messages from

**Response**: `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "topic": "string",
      "data": "string",
      "boardId": "string",
      "userId": "string",
      "createdAt": "ISO datetime string"
    }
  ]
}
```

**Example**:

```bash
curl -X GET "http://localhost:3000/boards/board-123/messages"
```

**Example Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "msg-001",
      "topic": "Welcome to the board",
      "data": "This is my first message on this board. Looking forward to great discussions!",
      "boardId": "board-123",
      "userId": "user-456",
      "createdAt": "2023-12-01T15:30:00.000Z"
    },
    {
      "id": "msg-002",
      "topic": "Project Update",
      "data": "The project is progressing well. We've completed phase 1 and moving to phase 2.",
      "boardId": "board-123",
      "userId": "user-789",
      "createdAt": "2023-12-01T16:45:00.000Z"
    }
  ]
}
```

**Error Example**:

```bash
# Missing or empty boardId
curl -X GET "http://localhost:3000/boards//messages"
```

## Error Handling

### Common Error Responses

**400 Bad Request** - Invalid input data:

```json
{
  "success": false,
  "error": {
    "message": "Validation error description",
    "statusCode": 400
  }
}
```

**404 Not Found** - Resource not found:

```json
{
  "success": false,
  "error": {
    "message": "Resource not found description",
    "statusCode": 404
  }
}
```

**500 Internal Server Error** - Server error:

```json
{
  "success": false,
  "error": {
    "message": "Internal server error",
    "statusCode": 500
  }
}
```

### Common Validation Errors

1. **Invalid JSON**: Request body contains invalid JSON
2. **Missing required fields**: Required fields are not provided
3. **Invalid email format**: Email doesn't match email pattern
4. **String length validation**: Strings are too short or too long
5. **Missing path parameters**: Required URL parameters are missing

## Rate Limiting

Currently, there are no rate limiting restrictions in place, but this may be implemented in future versions.

## CORS

The API supports Cross-Origin Resource Sharing (CORS). All origins are currently allowed in development mode.

## Complete Example Workflow

Here's a complete example of using the API to create a user, board, and post a message:

```bash
# 1. Register a user
echo "=== Registering a user ==="
curl -X POST "http://localhost:3000/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "name": "Alice Johnson"
  }'

echo -e "\n\n=== Waiting for user registration to complete ==="
sleep 2

# 2. Verify user was created
echo "=== Getting user by email ==="
curl -X GET "http://localhost:3000/users/alice@example.com"

# 3. Create a board
echo -e "\n\n=== Creating a board ==="
curl -X POST "http://localhost:3000/boards" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product Development",
    "createdBy": "user-alice-123"
  }'

echo -e "\n\n=== Waiting for board creation to complete ==="
sleep 2

# 4. List all boards
echo "=== Listing all boards ==="
curl -X GET "http://localhost:3000/boards"

# 5. Post a message (assuming board-456 exists)
echo -e "\n\n=== Posting a message ==="
curl -X POST "http://localhost:3000/boards/board-456/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Project Kickoff",
    "data": "Welcome everyone! Let'\''s start our new project discussion here.",
    "userId": "user-alice-123"
  }'

echo -e "\n\n=== Waiting for message posting to complete ==="
sleep 2

# 6. List messages from the board
echo "=== Listing messages from board ==="
curl -X GET "http://localhost:3000/boards/board-456/messages"
```

## Testing with Different HTTP Clients

### Using HTTPie

```bash
# Register user
http POST localhost:3000/users/register \
  email=john.doe@example.com \
  name="John Doe"

# Get user
http GET localhost:3000/users/john.doe@example.com

# Create board
http POST localhost:3000/boards \
  name="General Discussion" \
  createdBy=user-123

# Post message
http POST localhost:3000/boards/board-123/messages \
  topic="Welcome" \
  data="Hello everyone!" \
  userId=user-456
```

### Using Postman

Import this collection JSON:

```json
{
  "info": {
    "name": "Message Board API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Register User",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"user@example.com\",\n  \"name\": \"Test User\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/users/register",
          "host": ["{{base_url}}"],
          "path": ["users", "register"]
        }
      }
    },
    {
      "name": "Get User by Email",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{base_url}}/users/{{email}}",
          "host": ["{{base_url}}"],
          "path": ["users", "{{email}}"]
        }
      }
    },
    {
      "name": "List Boards",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{base_url}}/boards",
          "host": ["{{base_url}}"],
          "path": ["boards"]
        }
      }
    },
    {
      "name": "Create Board",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Test Board\",\n  \"createdBy\": \"user-123\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/boards",
          "host": ["{{base_url}}"],
          "path": ["boards"]
        }
      }
    },
    {
      "name": "Post Message",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"topic\": \"Test Topic\",\n  \"data\": \"Test message content\",\n  \"userId\": \"user-123\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/boards/{{boardId}}/messages",
          "host": ["{{base_url}}"],
          "path": ["boards", "{{boardId}}", "messages"]
        }
      }
    },
    {
      "name": "List Messages",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{base_url}}/boards/{{boardId}}/messages",
          "host": ["{{base_url}}"],
          "path": ["boards", "{{boardId}}", "messages"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000"
    },
    {
      "key": "email",
      "value": "user@example.com"
    },
    {
      "key": "boardId",
      "value": "board-123"
    }
  ]
}
```

## Notes

1. **Asynchronous Operations**: User registration, board creation, and message posting are asynchronous operations. They return `202 Accepted` immediately, but the actual processing happens in the background via SNS/SQS queues.

2. **Data Persistence**: Data is stored in DynamoDB tables. Make sure the tables are properly configured before testing.

3. **Environment Variables**: Some operations depend on environment variables (like SNS topic ARNs and SQS queue URLs) being properly set.

4. **Local Development**: When running locally with serverless-offline, use `http://localhost:3000` as the base URL.

5. **URL Encoding**: Remember to URL-encode special characters in path parameters, especially email addresses.

This API documentation provides all the information needed to interact with the Message Board API. All examples are ready to copy and run directly in your terminal or HTTP client of choice.

## WebSocket API

The Message Board API provides WebSocket support for real-time message subscriptions. Users can subscribe to specific boards and receive new messages instantly.

### WebSocket URL

- **Local Development**: `ws://localhost:3001`
- **Staging**: `wss://{websocket-api-id}.execute-api.ap-southeast-2.amazonaws.com/dev`
- **Production**: `wss://{websocket-api-id}.execute-api.ap-southeast-2.amazonaws.com/prod`

Replace `{websocket-api-id}` with your actual WebSocket API Gateway ID.

### Connection Management

#### Connect to WebSocket

Establish a WebSocket connection:

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = function(event) {
  console.log('WebSocket connected:', event);
};

ws.onclose = function(event) {
  console.log('WebSocket disconnected:', event);
};

ws.onerror = function(error) {
  console.error('WebSocket error:', error);
};

ws.onmessage = function(event) {
  const message = JSON.parse(event.data);
  console.log('Received message:', message);
};
```

#### Connection Events

When you connect, the server will store your connection and respond with:

```json
{
  "status": "connected",
  "connectionId": "connection-id-123"
}
```

### Message Subscription

#### Subscribe to a Board

Send a subscription message to start receiving messages for a specific board:

```javascript
const subscribeMessage = {
  action: "subscribe",
  boardId: "board-123",
  userId: "user-456"  // optional
};

ws.send(JSON.stringify(subscribeMessage));
```

**Message Format**:

```json
{
  "action": "subscribe",
  "boardId": "string (required)",
  "userId": "string (optional)"
}
```

**Response**:

```json
{
  "type": "subscription_confirmed",
  "boardId": "board-123",
  "connectionId": "connection-id-123"
}
```

#### Unsubscribe from a Board

Stop receiving messages for a board:

```javascript
const unsubscribeMessage = {
  action: "unsubscribe",
  boardId: "board-123"
};

ws.send(JSON.stringify(unsubscribeMessage));
```

**Message Format**:

```json
{
  "action": "unsubscribe",
  "boardId": "string (required)"
}
```

**Response**:

```json
{
  "type": "unsubscription_confirmed",
  "boardId": "board-123",
  "connectionId": "connection-id-123"
}
```

### Real-time Message Broadcasting

When a new message is posted to a board you're subscribed to, you'll receive:

```json
{
  "type": "message",
  "boardId": "board-123",
  "message": {
    "id": "msg-789",
    "topic": "New Topic",
    "data": "Message content here",
    "boardId": "board-123",
    "userId": "user-456",
    "createdAt": "2023-12-01T15:30:00.000Z"
  }
}
```

### Complete WebSocket Example

Here's a complete example of using WebSocket for real-time messaging:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Message Board WebSocket Example</title>
</head>
<body>
  <div id="messages"></div>
  <input type="text" id="boardId" placeholder="Board ID" value="board-123">
  <button onclick="subscribe()">Subscribe</button>
  <button onclick="unsubscribe()">Unsubscribe</button>

  <script>
    let ws;
    let currentBoardId;

    function connect() {
      ws = new WebSocket('ws://localhost:3001');
      
      ws.onopen = function(event) {
        console.log('WebSocket connected');
        addMessage('Connected to WebSocket');
      };

      ws.onclose = function(event) {
        console.log('WebSocket disconnected');
        addMessage('Disconnected from WebSocket');
      };

      ws.onerror = function(error) {
        console.error('WebSocket error:', error);
        addMessage('WebSocket error: ' + error);
      };

      ws.onmessage = function(event) {
        const data = JSON.parse(event.data);
        console.log('Received:', data);
        
        switch(data.type) {
          case 'subscription_confirmed':
            addMessage(`Subscribed to board: ${data.boardId}`);
            break;
          case 'unsubscription_confirmed':
            addMessage(`Unsubscribed from board: ${data.boardId}`);
            break;
          case 'message':
            addMessage(`New message in ${data.boardId}: ${data.message.topic} - ${data.message.data}`);
            break;
          default:
            addMessage(`Unknown message type: ${JSON.stringify(data)}`);
        }
      };
    }

    function subscribe() {
      const boardId = document.getElementById('boardId').value;
      if (!boardId) {
        alert('Please enter a board ID');
        return;
      }

      currentBoardId = boardId;
      const message = {
        action: 'subscribe',
        boardId: boardId,
        userId: 'user-123'  // Replace with actual user ID
      };

      ws.send(JSON.stringify(message));
    }

    function unsubscribe() {
      if (!currentBoardId) {
        alert('Not subscribed to any board');
        return;
      }

      const message = {
        action: 'unsubscribe',
        boardId: currentBoardId
      };

      ws.send(JSON.stringify(message));
      currentBoardId = null;
    }

    function addMessage(text) {
      const messagesDiv = document.getElementById('messages');
      const messageElement = document.createElement('div');
      messageElement.textContent = `${new Date().toLocaleTimeString()}: ${text}`;
      messagesDiv.appendChild(messageElement);
    }

    // Connect automatically when page loads
    connect();
  </script>
</body>
</html>
```

### Node.js WebSocket Client Example

```javascript
const WebSocket = require('ws');

class MessageBoardClient {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.currentSubscriptions = new Set();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.ws.on('open', () => {
      console.log('Connected to message board WebSocket');
    });

    this.ws.on('close', () => {
      console.log('Disconnected from message board WebSocket');
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    this.ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      this.handleMessage(message);
    });
  }

  handleMessage(message) {
    switch(message.type) {
      case 'subscription_confirmed':
        console.log(`✅ Subscribed to board: ${message.boardId}`);
        this.currentSubscriptions.add(message.boardId);
        break;

      case 'unsubscription_confirmed':
        console.log(`❌ Unsubscribed from board: ${message.boardId}`);
        this.currentSubscriptions.delete(message.boardId);
        break;

      case 'message':
        console.log(`📨 New message in ${message.boardId}:`);
        console.log(`   Topic: ${message.message.topic}`);
        console.log(`   Content: ${message.message.data}`);
        console.log(`   By: ${message.message.userId}`);
        console.log(`   At: ${message.message.createdAt}`);
        break;

      default:
        console.log('Unknown message:', message);
    }
  }

  subscribe(boardId, userId) {
    const message = {
      action: 'subscribe',
      boardId,
      userId
    };
    this.ws.send(JSON.stringify(message));
  }

  unsubscribe(boardId) {
    const message = {
      action: 'unsubscribe',
      boardId
    };
    this.ws.send(JSON.stringify(message));
  }

  close() {
    this.ws.close();
  }
}

// Usage
const client = new MessageBoardClient('ws://localhost:3001');

// Subscribe to a board after connection is established
setTimeout(() => {
  client.subscribe('board-123', 'user-456');
}, 1000);

// Unsubscribe after 10 seconds
setTimeout(() => {
  client.unsubscribe('board-123');
}, 10000);

// Close connection after 15 seconds
setTimeout(() => {
  client.close();
}, 15000);
```

### WebSocket Error Handling

#### Common Errors

**400 Bad Request** - Invalid message format:

```json
{
  "success": false,
  "error": {
    "message": "Invalid message format: action is required",
    "statusCode": 400
  }
}
```

**400 Bad Request** - Missing connection ID:

```json
{
  "success": false,
  "error": {
    "message": "Connection ID not found",
    "statusCode": 400
  }
}
```

**500 Internal Server Error** - Server error:

```json
{
  "success": false,
  "error": {
    "message": "Internal server error",
    "statusCode": 500
  }
}
```

### Testing WebSocket with curl

You can test the WebSocket connection using curl with the `--http1.1` flag:

```bash
# Note: This only tests the initial HTTP upgrade request
# For full WebSocket testing, use a proper WebSocket client
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Version: 13" \
     -H "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==" \
     --http1.1 \
     "ws://localhost:3001/"
```

### Integration with REST API

The WebSocket API works seamlessly with the REST API:

1. **Use REST API** to post messages to boards
2. **Use WebSocket** to receive real-time notifications when messages are posted
3. **Use REST API** to retrieve historical messages
4. **Use WebSocket** for live updates and notifications

This combination provides both reliability (REST API) and real-time capabilities (WebSocket).

### Connection Lifecycle

1. **Connect**: Client establishes WebSocket connection
2. **Store Connection**: Server stores connection in DynamoDB
3. **Subscribe**: Client sends subscribe message for specific boards
4. **Update Subscription**: Server updates connection with board subscription
5. **Broadcast**: When messages are posted via REST API, they're automatically broadcast to subscribed WebSocket clients
6. **Disconnect**: Connection is automatically cleaned up when client disconnects

### Deployment Notes

- **Local Development**: Use `ws://` protocol
- **Production**: Use `wss://` (secure WebSocket) protocol
- **API Gateway**: WebSocket API is separate from REST API Gateway
- **Lambda Functions**: Separate Lambda functions handle WebSocket events
- **DynamoDB**: Connection state is stored in a dedicated WebSocket connections table

The WebSocket API provides a powerful way to build real-time messaging applications on top of the Message Board API.
