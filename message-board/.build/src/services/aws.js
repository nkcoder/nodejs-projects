"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamoDbClient = exports.snsClient = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const client_sns_1 = require("@aws-sdk/client-sns");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const region = process.env.AWS_REGION ?? 'ap-southeast-2';
// SNS client
const snsClient = () => new client_sns_1.SNSClient({ region });
exports.snsClient = snsClient;
// DynamoDB client
const dynamoDbClient = () => {
    const client = new client_dynamodb_1.DynamoDBClient({ region });
    return lib_dynamodb_1.DynamoDBDocument.from(client);
};
exports.dynamoDbClient = dynamoDbClient;
//# sourceMappingURL=aws.js.map