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
const vitest_1 = require("vitest");
const userService = __importStar(require("../../src/services/userService"));
const mockSend = vitest_1.vi.fn();
vitest_1.vi.mock('../../src/services/aws', () => ({
    snsClient: () => ({ send: mockSend }),
}));
vitest_1.vi.mock('../../src/services/userService', () => ({
    getUserByEmail: vitest_1.vi.fn(),
}));
const client_sns_1 = require("@aws-sdk/client-sns");
const user_1 = require("../../src/handlers/user");
(0, vitest_1.describe)('user handler', () => {
    const mockTopicArn = 'arn:aws:sns:ap-southeast-2:123456789012:user-registration-topic';
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        mockSend.mockClear();
        process.env.USER_REGISTRATION_TOPIC_ARN = mockTopicArn;
    });
    (0, vitest_1.afterAll)(() => {
        delete process.env.USER_REGISTRATION_TOPIC_ARN;
    });
    // TODO: to test invalid input, we might need to define a specific type for the input, rather than using any
    const createEvent = (body) => ({
        body: JSON.stringify(body),
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'POST',
        isBase64Encoded: false,
        path: '/users/register',
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {
            accountId: '123456789012',
            apiId: 'test-api',
            stage: 'test',
            requestId: 'test-request-id',
            identity: {
                sourceIp: '127.0.0.1',
                userAgent: 'test-agent',
            },
            httpMethod: 'POST',
            resourcePath: '/users/register',
        },
        resource: '',
    });
    (0, vitest_1.describe)('registerUser', () => {
        (0, vitest_1.it)('should successfully register a user', async () => {
            const requestBody = {
                email: 'test@example.com',
                name: 'Test User',
            };
            mockSend.mockResolvedValueOnce({ MessageId: '123' });
            const event = createEvent(requestBody);
            const result = await (0, user_1.registerUser)(event);
            (0, vitest_1.expect)(result.statusCode).toBe(202);
            const body = JSON.parse(result.body);
            (0, vitest_1.expect)(body.success).toBe(true);
            (0, vitest_1.expect)(body.data.message).toBe('User registration request is accepted.');
            (0, vitest_1.expect)(mockSend).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(mockSend).toHaveBeenCalledWith(vitest_1.expect.any(client_sns_1.PublishCommand));
            const publishCommand = mockSend.mock.calls[0][0];
            (0, vitest_1.expect)(publishCommand.input).toEqual({
                TopicArn: mockTopicArn,
                Message: JSON.stringify(requestBody),
            });
        });
        (0, vitest_1.it)('should handle invalid email format', async () => {
            const requestBody = {
                email: 'invalid-email',
                name: 'Test User',
            };
            const event = createEvent(requestBody);
            await (0, vitest_1.expect)((0, user_1.registerUser)(event)).rejects.toThrow();
            (0, vitest_1.expect)(mockSend).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle invalid name (too short, less than 2 characters)', async () => {
            const requestBody = {
                email: 'test@example.com',
                name: 'A',
            };
            const event = createEvent(requestBody);
            await (0, vitest_1.expect)((0, user_1.registerUser)(event)).rejects.toThrow();
            (0, vitest_1.expect)(mockSend).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle invalid name (too long, more than 30 characters)', async () => {
            const requestBody = {
                email: 'test@example.com',
                name: 'A'.repeat(31),
            };
            const event = createEvent(requestBody);
            await (0, vitest_1.expect)((0, user_1.registerUser)(event)).rejects.toThrow();
            (0, vitest_1.expect)(mockSend).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle missing body', async () => {
            const event = createEvent(null);
            event.body = null;
            await (0, vitest_1.expect)((0, user_1.registerUser)(event)).rejects.toThrow();
            (0, vitest_1.expect)(mockSend).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle empty body', async () => {
            const event = createEvent({});
            await (0, vitest_1.expect)((0, user_1.registerUser)(event)).rejects.toThrow();
            (0, vitest_1.expect)(mockSend).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle invalid JSON in body', async () => {
            const event = createEvent({});
            event.body = 'invalid json';
            await (0, vitest_1.expect)((0, user_1.registerUser)(event)).rejects.toThrow();
            (0, vitest_1.expect)(mockSend).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle SNS send error', async () => {
            const requestBody = {
                email: 'test@example.com',
                name: 'Test User',
            };
            mockSend.mockRejectedValueOnce(new Error('SNS error'));
            const event = createEvent(requestBody);
            await (0, vitest_1.expect)((0, user_1.registerUser)(event)).rejects.toThrow('SNS error');
            (0, vitest_1.expect)(mockSend).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('should handle missing topic ARN', async () => {
            delete process.env.USER_REGISTRATION_TOPIC_ARN;
            const requestBody = {
                email: 'test@example.com',
                name: 'Test User',
            };
            mockSend.mockResolvedValueOnce({ MessageId: '123' });
            const event = createEvent(requestBody);
            const result = await (0, user_1.registerUser)(event);
            // Should still work but with undefined topic ARN
            (0, vitest_1.expect)(result.statusCode).toBe(202);
            const publishCommand = mockSend.mock.calls[0][0];
            (0, vitest_1.expect)(publishCommand.input.TopicArn).toBeUndefined();
        });
        (0, vitest_1.it)('should handle special characters in name', async () => {
            const requestBody = {
                email: 'test@example.com',
                name: "Test User-O'Brien",
            };
            mockSend.mockResolvedValueOnce({ MessageId: '123' });
            const event = createEvent(requestBody);
            const result = await (0, user_1.registerUser)(event);
            (0, vitest_1.expect)(result.statusCode).toBe(202);
            (0, vitest_1.expect)(mockSend).toHaveBeenCalledTimes(1);
        });
    });
    (0, vitest_1.describe)('getUserByEmail', () => {
        (0, vitest_1.it)('should return user data', async () => {
            const email = 'test@example.com';
            const user = {
                id: '123',
                email,
                name: 'Test User',
                createdAt: new Date().toISOString(),
            };
            vitest_1.vi.mocked(userService.getUserByEmail).mockResolvedValueOnce(user);
            // Create event with path parameters
            const event = {
                ...createEvent({}),
                pathParameters: { email },
            };
            const result = await (0, user_1.getUserByEmail)(event);
            (0, vitest_1.expect)(result.statusCode).toBe(200);
            const body = JSON.parse(result.body);
            (0, vitest_1.expect)(body.success).toBe(true);
            (0, vitest_1.expect)(body.data).toEqual(user);
        });
        (0, vitest_1.it)('should handle user not found', async () => {
            const email = 'test@example.com';
            vitest_1.vi.mocked(userService.getUserByEmail).mockResolvedValueOnce(null);
            // Create event with path parameters
            const event = {
                ...createEvent({}),
                pathParameters: { email },
            };
            const result = await (0, user_1.getUserByEmail)(event);
            (0, vitest_1.expect)(result.statusCode).toBe(404);
            const body = JSON.parse(result.body);
            (0, vitest_1.expect)(body.success).toBe(false);
            (0, vitest_1.expect)(body.error.message).toBe(`User with email ${email} not found`);
        });
        (0, vitest_1.it)('should handle missing email parameter', async () => {
            const event = {
                ...createEvent({}),
                pathParameters: null,
            };
            const result = await (0, user_1.getUserByEmail)(event);
            (0, vitest_1.expect)(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            (0, vitest_1.expect)(body.success).toBe(false);
            (0, vitest_1.expect)(body.error.message).toBe('email parameter is required');
        });
        (0, vitest_1.it)('should handle invalid email format', async () => {
            const invalidEmail = 'invalid-email';
            const event = {
                ...createEvent({}),
                pathParameters: { email: invalidEmail },
            };
            const result = await (0, user_1.getUserByEmail)(event);
            (0, vitest_1.expect)(result.statusCode).toBe(400);
            const body = JSON.parse(result.body);
            (0, vitest_1.expect)(body.success).toBe(false);
            (0, vitest_1.expect)(body.error.message).toBe('Invalid email format');
        });
    });
});
//# sourceMappingURL=user.test.js.map