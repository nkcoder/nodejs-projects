# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development
- `npm run build` - Compile TypeScript to JavaScript 
- `npm run dev` - Start local development with serverless dev (live AWS resources)
- `npm run offline` - Run serverless offline for local testing (stage: local)

### Testing
- `npm run test` - Run unit tests with Vitest
- `npm run test_ui` - Run tests with Vitest UI
- `npm run test_coverage` - Run tests with coverage reports

### Linting and Formatting  
- `npm run lint` - Check code with ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier

### Deployment
- `npm run deploy` - Deploy to AWS (default: dev stage)
- `npm run deploy --stage prod` - Deploy to production
- `npm run remove` - Remove serverless stack
- `npm run prune` - Remove old deployed versions

## Architecture Overview

This is an **event-driven serverless message board API** built with:
- **AWS Lambda functions** (Node.js 22.x, TypeScript)
- **API Gateway** for HTTP endpoints
- **DynamoDB** for data storage (users, boards, messages)
- **SNS/SQS** for async event processing
- **Serverless Framework** for infrastructure as code

### Core Architecture Pattern

The system follows an **async event-driven pattern**:
1. **API handlers** receive HTTP requests and either:
   - Return data immediately (GET operations)
   - Publish events to SNS/SQS for async processing (POST operations)
2. **Processor functions** listen to SNS/SQS events and handle the actual data creation
3. **Service layer** handles DynamoDB operations and business logic

### Key Components

**API Handlers** (`src/handlers/`):
- `user.ts` - User registration (SNS) and retrieval
- `board.ts` - Board creation (SQS) and listing  
- `message.ts` - Message posting (SNS)

**Event Processors** (`src/handlers/processors.ts`):
- `processUserRegistration` - Creates users from SNS events
- `processBoardCreation` - Creates boards from SQS events
- `processMessagePosting` - Creates messages from SNS events

**Services** (`src/services/`):
- `userService.ts` - User CRUD operations
- `dynamodb.ts` - DynamoDB client configuration
- `aws.ts` - AWS service clients (SNS, SQS, DynamoDB)
- `idGenerator.ts` - UUID generation

**Schemas** (`src/schema/`):
- Uses **Zod** for runtime type validation and TypeScript type generation

### Database Design

**DynamoDB Tables**:
- `users-table-{stage}` - PK: id+createdAt, GSI: email
- `boards-table-{stage}` - PK: id+createdAt  
- `messages-table-{stage}` - PK: id+createdAt, GSI: boardId, userId, topic

### Event Flow Examples

**User Registration**:
POST /users/register → SNS event → processUserRegistration → DynamoDB

**Board Creation**: 
POST /boards → SQS message → processBoardCreation → DynamoDB

**Message Posting**:
POST /boards/{boardId}/messages → SNS event → processMessagePosting → DynamoDB

## Development Notes

- **Profile Configuration**: Uses `daniel_dev` AWS profile (see `serverless.yml`)
- **Region**: ap-southeast-2 (Sydney)
- **Testing**: Uses Vitest with coverage reports in `coverage/` directory
- **Code Quality**: ESLint + Prettier with security and SonarJS plugins
- **Type Safety**: Strict TypeScript with Zod schemas for runtime validation
- **Error Handling**: API returns appropriate HTTP status codes, processors log errors

## Environment Variables (Set by Serverless)

- `USERS_TABLE`, `BOARDS_TABLE`, `MESSAGES_TABLE` - DynamoDB table names
- `USER_REGISTRATION_TOPIC_ARN`, `MESSAGE_POSTING_TOPIC_ARN` - SNS topic ARNs
- `BOARD_CREATION_QUEUE_URL`, `BOARD_CREATION_QUEUE_ARN` - SQS queue details
- `REGION` - AWS region