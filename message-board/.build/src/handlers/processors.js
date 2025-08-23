"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMessagePosting = exports.processBoardCreation = exports.processUserRegistration = void 0;
const userSchema_1 = require("../schema/userSchema");
const boardSchema_1 = require("../schema/boardSchema");
const messageSchema_1 = require("../schema/messageSchema");
const userService_1 = require("../services/userService");
const boardService_1 = require("../services/boardService");
const messageService_1 = require("../services/messageService");
const messageParser_1 = require("../utils/messageParser");
const processUserRegistration = async (event) => {
    console.info(`Received user registration requests: ${JSON.stringify(event)}`);
    const results = await Promise.allSettled(event.Records.map(async (record) => {
        try {
            const registerRequest = (0, messageParser_1.parseSnsMessage)(record, userSchema_1.registerUserSchema);
            const id = await (0, userService_1.createUser)(registerRequest.email, registerRequest.name);
            console.info(`Created user, id: ${id}, name: ${registerRequest.name}, email: ${registerRequest.email}`);
            return { success: true, id };
        }
        catch (error) {
            console.error(`Failed to process user registration record:`, {
                messageId: record.Sns.MessageId,
                error: error instanceof Error ? error.message : String(error),
                cause: error instanceof messageParser_1.MessageParsingError ? error.cause?.message : undefined,
            });
            return { success: false, error };
        }
    }));
    const successful = results.filter(result => result.status === 'fulfilled' && result.value.success).length;
    const failed = results.length - successful;
    console.info(`Processed ${event.Records.length} user registration requests: ${successful} successful, ${failed} failed`);
};
exports.processUserRegistration = processUserRegistration;
const processBoardCreation = async (event) => {
    console.info(`Received board creation requests: ${JSON.stringify(event)}`);
    const results = await Promise.allSettled(event.Records.map(async (record) => {
        try {
            const createRequest = (0, messageParser_1.parseSqsMessage)(record, boardSchema_1.createBoardSchema);
            const id = await (0, boardService_1.createBoard)(createRequest.name, createRequest.createdBy);
            console.info(`Created board, id: ${id}, name: ${createRequest.name}, createdBy: ${createRequest.createdBy}`);
            return { success: true, id };
        }
        catch (error) {
            console.error(`Failed to process board creation record:`, {
                messageId: record.messageId,
                error: error instanceof Error ? error.message : String(error),
                cause: error instanceof messageParser_1.MessageParsingError ? error.cause?.message : undefined,
            });
            return { success: false, error };
        }
    }));
    const successful = results.filter(result => result.status === 'fulfilled' && result.value.success).length;
    const failed = results.length - successful;
    console.info(`Processed ${event.Records.length} board creation requests: ${successful} successful, ${failed} failed`);
};
exports.processBoardCreation = processBoardCreation;
const processMessagePosting = async (event) => {
    console.info(`Received message posting requests: ${JSON.stringify(event)}`);
    const results = await Promise.allSettled(event.Records.map(async (record) => {
        try {
            const postRequest = (0, messageParser_1.parseSnsMessage)(record, messageSchema_1.postMessageSchema);
            const id = await (0, messageService_1.createMessage)(postRequest.topic, postRequest.data, postRequest.boardId, postRequest.userId);
            console.info(`Created message, id: ${id}, topic: ${postRequest.topic}, boardId: ${postRequest.boardId}, userId: ${postRequest.userId}`);
            return { success: true, id };
        }
        catch (error) {
            console.error(`Failed to process message posting record:`, {
                messageId: record.Sns.MessageId,
                error: error instanceof Error ? error.message : String(error),
                cause: error instanceof messageParser_1.MessageParsingError ? error.cause?.message : undefined,
            });
            return { success: false, error };
        }
    }));
    const successful = results.filter(result => result.status === 'fulfilled' && result.value.success).length;
    const failed = results.length - successful;
    console.info(`Processed ${event.Records.length} message posting requests: ${successful} successful, ${failed} failed`);
};
exports.processMessagePosting = processMessagePosting;
//# sourceMappingURL=processors.js.map