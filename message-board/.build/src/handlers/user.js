"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByEmail = exports.registerUser = void 0;
const client_sns_1 = require("@aws-sdk/client-sns");
const userSchema_1 = require("../schema/userSchema");
const aws_1 = require("../services/aws");
const userService = __importStar(require("../services/userService"));
const registerUser = async (event) => {
    console.info(`Received user registration request: ${event.body}`);
    const registerRequest = userSchema_1.registerUserSchema.parse(JSON.parse(event.body ?? '{}'));
    // send user registration event to SNS
    const topicArn = process.env.USER_REGISTRATION_TOPIC_ARN;
    const command = new client_sns_1.PublishCommand({
        TopicArn: topicArn,
        Message: JSON.stringify(registerRequest),
    });
    await (0, aws_1.snsClient)().send(command);
    console.info(`Sent user registration request to SNS: ${topicArn}.`);
    return {
        statusCode: 202, // Accepted, but not processed completely
        body: JSON.stringify({ message: 'User registration request is accepted.' }),
    };
};
exports.registerUser = registerUser;
const getUserByEmail = async (event) => {
    console.info(`Received fetch user by email request: ${event.pathParameters?.email}`);
    // Get email from path parameters
    const email = event.pathParameters?.email;
    if (email == null || email === '') {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Email parameter is required' }),
        };
    }
    // Decode URL-encoded email
    const decodedEmail = decodeURIComponent(email);
    // Validate email format (basic validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(decodedEmail)) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Invalid email format' }),
        };
    }
    const user = await userService.getUserByEmail(decodedEmail);
    if (user === null) {
        return {
            statusCode: 404,
            body: JSON.stringify({
                message: `User with email ${decodedEmail} not found`,
            }),
        };
    }
    return {
        statusCode: 200,
        body: JSON.stringify(user),
    };
};
exports.getUserByEmail = getUserByEmail;
//# sourceMappingURL=user.js.map