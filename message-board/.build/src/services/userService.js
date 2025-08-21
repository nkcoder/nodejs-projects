"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByEmail = exports.createUser = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const userSchema_1 = require("../schema/userSchema");
const aws_1 = require("./aws");
const idGenerator_1 = require("./idGenerator");
const createUser = async (email, name) => {
    const existingUser = await (0, exports.getUserByEmail)(email);
    if (existingUser !== null) {
        throw new Error(`User with email ${email} already exists`);
    }
    const id = (0, idGenerator_1.generateId)();
    const db = (0, aws_1.dynamoDbClient)();
    await db.send(new lib_dynamodb_1.PutCommand({
        TableName: process.env.USERS_TABLE,
        Item: {
            id,
            email,
            name,
            createdAt: new Date().toISOString(),
        },
    }));
    return id;
};
exports.createUser = createUser;
const getUserByEmail = async (email) => {
    const db = (0, aws_1.dynamoDbClient)();
    const result = await db.send(new lib_dynamodb_1.QueryCommand({
        TableName: process.env.USERS_TABLE,
        IndexName: 'email-index',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
            ':email': email,
        },
    }));
    if (!result.Items || result.Items.length === 0) {
        return null;
    }
    console.log(`result: ${JSON.stringify(result.Items[0])}`);
    return userSchema_1.userSchema.parse(result.Items[0]);
};
exports.getUserByEmail = getUserByEmail;
//# sourceMappingURL=userService.js.map