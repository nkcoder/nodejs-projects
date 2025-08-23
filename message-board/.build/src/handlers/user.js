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
const pathParamsSchema_1 = require("../schema/pathParamsSchema");
const aws_1 = require("../services/aws");
const userService = __importStar(require("../services/userService"));
const apiHelpers_1 = require("../utils/apiHelpers");
const handleRegisterUser = async (event) => {
    const registerRequest = (0, apiHelpers_1.validateRequestBody)(event.body, userSchema_1.registerUserSchema);
    // send user registration event to SNS
    const topicArn = process.env.USER_REGISTRATION_TOPIC_ARN;
    if (!topicArn) {
        throw new apiHelpers_1.ApiError(500, 'User registration topic not configured');
    }
    const command = new client_sns_1.PublishCommand({
        TopicArn: topicArn,
        Message: JSON.stringify(registerRequest),
    });
    await (0, aws_1.snsClient)().send(command);
    return (0, apiHelpers_1.createAcceptedResponse)('User registration request is accepted.');
};
const handleGetUserByEmail = async (event) => {
    const email = (0, apiHelpers_1.getPathParameter)(event, 'email');
    const validatedEmail = (0, pathParamsSchema_1.validateEmailParam)(email);
    const user = await userService.getUserByEmail(validatedEmail);
    if (user === null) {
        throw new apiHelpers_1.ApiError(404, `User with email ${validatedEmail} not found`);
    }
    return (0, apiHelpers_1.createSuccessResponse)(user);
};
exports.registerUser = (0, apiHelpers_1.withErrorHandling)('registerUser', handleRegisterUser);
exports.getUserByEmail = (0, apiHelpers_1.withErrorHandling)('getUserByEmail', handleGetUserByEmail);
//# sourceMappingURL=user.js.map