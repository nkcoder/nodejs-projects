"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processUserRegistration = void 0;
const userSchema_1 = require("../schema/userSchema");
const userService_1 = require("../services/userService");
const processUserRegistration = async (event) => {
    console.info(`Received user registration requests: ${JSON.stringify(event)}`);
    const recordPromises = event.Records.map(async (record) => {
        const message = JSON.parse(record.Sns.Message);
        const registerRequest = userSchema_1.registerUserSchema.parse(message);
        const id = await (0, userService_1.createUser)(registerRequest.email, registerRequest.name);
        console.info(`Created user, id: ${id}, name: ${registerRequest.name}, email: ${registerRequest.email}`);
    });
    await Promise.all(recordPromises);
    console.info(`Processed ${event.Records.length} user registration requests.`);
};
exports.processUserRegistration = processUserRegistration;
//# sourceMappingURL=processors.js.map