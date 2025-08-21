## Review/tune configuration

- [ ] SNS
  - retry
  - delivery status logging
  - active tracing

- [ ] SQS
  - dlq
  - monitoring/alerts

- Serverless
  - [ ] API Tracing
  - [ ] Tags

## CI/CD

- [ ] Github Actions

## Practice

- [ ] githook: husky
- [ ] error handling

## Features

### Get user by email

Add a handler to `handlers/user.getUserByEmail`:
- get user by email from DynamoDB
- return synchronously.

### Create a new message board

Add a handler to `handlers/board.createBoard`:
- send message to the queue
- return immediately

### Post a message to a board

Add a handler to `handlers/message.postMessage`:
- sent message to the sns
- return immediately

### List message boards

Add a handler to `handlers/board.listBoards`:
- get all boards from dynamodb (no auth)
- return synchronously

### Subscribe to new messages

As the assessment doc mentioned, we can use websocket or appsync for the realtime subscription:
- websocket: need a lambda function to handle the subscription, which integrates with API Gateway websocket
- appsync: use subscription and graphql
