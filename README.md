# **Message Board - Serverless Real-Time Communication Platform**

A scalable, event-driven message board application built with serverless architecture on AWS. The platform enables users to create discussion boards, post messages, and receive real-time notifications through WebSocket subscriptions.

## **Key Features**
- **Asynchronous Operations**: User registration, board creation, and message posting with immediate API responses
- **Real-Time Messaging**: WebSocket-based subscriptions for instant message notifications
- **Event-Driven Architecture**: Decoupled components using SNS/SQS for reliable message processing
- **Multi-Board Support**: Users can subscribe to multiple boards simultaneously
- **Auto-Scaling**: Serverless design handles variable load automatically

## **Tech Stack**

### **Backend Services:**
- **AWS Lambda** - Serverless compute for API handlers and event processors
- **API Gateway** - REST API and WebSocket API management
- **DynamoDB** - NoSQL database with optimized indexes for users, boards, messages, and connections
- **SNS/SQS** - Event bus for asynchronous message processing
- **AWS SDK v3** - Modern AWS service integration

### **Development & Deployment:**
- **TypeScript** - Type-safe development with strict configuration
- **Serverless Framework** - Infrastructure as Code and deployment automation
- **Node.js 22.x** - Runtime environment
- **Zod** - Schema validation and type generation
- **Vitest** - Unit testing with 95% coverage threshold
- **ESLint + Prettier** - Code quality and formatting

### **Architecture Patterns:**
- **Event-Driven Architecture** - Asynchronous processing with SNS/SQS
- **CQRS** - Separate read/write operations for optimal performance  
- **Microservices** - Independent Lambda functions for different concerns
- **Real-Time Broadcasting** - WebSocket connections with DynamoDB state management

### **Operational:**
- **GitHub Actions** - CI/CD pipeline with automated testing and deployment
- **CloudWatch** - Monitoring, logging, and observability
- **Husky** - Pre-commit hooks for code quality
- **Multi-stage Deployment** - Development and production environments

## **Architecture Highlights**
- **Serverless-First**: No server management, automatic scaling, pay-per-use pricing
- **Event-Driven**: Producers and consumers decoupled for resilience and scalability
- **Real-Time Capable**: WebSocket integration for instant message delivery
- **Cloud-Native**: Built specifically for AWS services and best practices

This project demonstrates modern serverless application development with real-time capabilities, event-driven patterns, and production-ready DevOps practices.