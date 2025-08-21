"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const mockSend = vitest_1.vi.fn();
vitest_1.vi.mock('../../src/services/aws', () => ({
    dynamoDbClient: () => ({ send: mockSend }),
}));
vitest_1.vi.mock('../../src/services/idGenerator', () => ({
    generateId: vitest_1.vi.fn(),
}));
const idGenerator_1 = require("../../src/services/idGenerator");
const userService_1 = require("../../src/services/userService");
(0, vitest_1.describe)('userService', () => {
    const mockIdGenerator = vitest_1.vi.mocked(idGenerator_1.generateId);
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        mockSend.mockClear();
    });
    (0, vitest_1.beforeAll)(() => {
        process.env.USERS_TABLE = 'users-table-test';
    });
    (0, vitest_1.afterAll)(() => {
        delete process.env.USERS_TABLE;
    });
    (0, vitest_1.describe)('createUser', () => {
        (0, vitest_1.it)('should create a user successfully when the user does not exist', async () => {
            mockIdGenerator.mockReturnValue('123');
            // get users by email, returns empty
            mockSend.mockResolvedValueOnce({ Items: [] });
            // create user
            mockSend.mockResolvedValueOnce({});
            const id = await (0, userService_1.createUser)('test@test.com', 'Test User');
            (0, vitest_1.expect)(id).toBe('123');
            (0, vitest_1.expect)(mockIdGenerator).toHaveBeenCalled();
            (0, vitest_1.expect)(mockSend).toHaveBeenNthCalledWith(1, vitest_1.expect.objectContaining({
                input: {
                    TableName: process.env.USERS_TABLE,
                    IndexName: 'email-index',
                    KeyConditionExpression: 'email = :email',
                    ExpressionAttributeValues: {
                        ':email': 'test@test.com',
                    },
                },
            }));
            (0, vitest_1.expect)(mockSend).toHaveBeenNthCalledWith(2, vitest_1.expect.objectContaining({
                input: {
                    TableName: process.env.USERS_TABLE,
                    Item: {
                        id: '123',
                        email: 'test@test.com',
                        name: 'Test User',
                        createdAt: vitest_1.expect.any(String), // Don't check exact timestamp
                    },
                },
            }));
        });
        (0, vitest_1.it)('should throw error when user already exists', async () => {
            const email = 'existing@example.com';
            const name = 'Existing User';
            mockSend.mockResolvedValueOnce({
                Items: [
                    {
                        id: 'existing-id',
                        email,
                        name,
                        createdAt: '2023-01-01T00:00:00.000Z',
                    },
                ],
            });
            await (0, vitest_1.expect)((0, userService_1.createUser)(email, name)).rejects.toThrow(`User with email ${email} already exists`);
            (0, vitest_1.expect)(mockSend).toHaveBeenCalledTimes(1); // Only the query call
            (0, vitest_1.expect)(mockIdGenerator).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should handle DynamoDB errors', async () => {
            const email = 'test@example.com';
            const name = 'Test User';
            // Mock getUserByEmail to return null
            mockSend.mockResolvedValueOnce({ Items: [] });
            // Mock generateId
            mockIdGenerator.mockReturnValue('mock-id');
            // Mock PutCommand to throw error
            mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));
            await (0, vitest_1.expect)((0, userService_1.createUser)(email, name)).rejects.toThrow('DynamoDB error');
        });
    });
    (0, vitest_1.describe)('getUserByEmail', () => {
        (0, vitest_1.it)('should return user when email exists', async () => {
            const email = 'test@example.com';
            const name = 'Test User';
            mockSend.mockResolvedValueOnce({
                Items: [
                    {
                        id: '123',
                        email,
                        name,
                        createdAt: '2023-01-01T00:00:00.000Z',
                    },
                ],
            });
            const user = await (0, userService_1.getUserByEmail)(email);
            (0, vitest_1.expect)(user).toEqual({
                id: '123',
                email,
                name,
                createdAt: '2023-01-01T00:00:00.000Z',
            });
        });
        (0, vitest_1.it)('should return null when email does not exist', async () => {
            const email = 'nonexistent@example.com';
            mockSend.mockResolvedValueOnce({ Items: [] });
            const user = await (0, userService_1.getUserByEmail)(email);
            (0, vitest_1.expect)(user).toBeNull();
        });
        (0, vitest_1.it)('should handle DynamoDB errors', async () => {
            const email = 'test@example.com';
            mockSend.mockRejectedValueOnce(new Error('DynamoDB error'));
            await (0, vitest_1.expect)((0, userService_1.getUserByEmail)(email)).rejects.toThrow('DynamoDB error');
        });
    });
});
//# sourceMappingURL=userService.test.js.map