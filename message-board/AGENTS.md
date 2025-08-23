# AGENTS.md - Development Guidelines for AI Coding Agents

## Build/Test/Lint Commands
- `npm run build` - Compile TypeScript
- `npm run test` - Run all unit tests
- `vitest run test/path/to/file.test.ts` - Run single test file
- `npm run test_coverage` - Run tests with coverage (95% threshold)
- `npm run lint` - Check code with ESLint
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Format with Prettier

## Code Style Guidelines
- **Formatting**: Prettier (2 spaces, single quotes, 120 char width, semicolons)
- **Imports**: Use type-only imports (`import type { ... } from '...'`) for TypeScript types
- **Naming**: camelCase variables/functions, PascalCase classes/types/enums, interfaces prefixed with 'I'
- **Functions**: Explicit return types required (`function foo(): string`)
- **Types**: Use Zod schemas for validation, strict TypeScript, avoid `any`
- **Error Handling**: Use custom ApiError class, proper HTTP status codes
- **Async**: Always handle promises properly, use async/await consistently
- **Files**: Group by feature (handlers/, services/, schema/, utils/)

## Project Structure
Event-driven serverless API with AWS Lambda, DynamoDB, SNS/SQS. API handlers publish events, processor functions handle actual data operations. Use Zod schemas for validation and TypeScript types.