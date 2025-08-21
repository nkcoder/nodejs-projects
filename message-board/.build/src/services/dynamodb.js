"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamoDbClient = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
exports.dynamoDbClient = new client_dynamodb_1.DynamoDBClient({
    region: process.env.AWS_REGION,
});
//# sourceMappingURL=dynamodb.js.map