"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByEmailSchema = exports.userSchema = exports.registerUserSchema = void 0;
const zod_1 = require("zod");
exports.registerUserSchema = zod_1.z.object({
    email: zod_1.z.email(),
    name: zod_1.z.string().min(2).max(30),
});
exports.userSchema = zod_1.z.object({
    id: zod_1.z.string(),
    email: zod_1.z.email(),
    name: zod_1.z.string().min(2).max(30),
    createdAt: zod_1.z.iso.datetime(),
});
exports.getUserByEmailSchema = zod_1.z.object({
    email: zod_1.z.email(),
});
//# sourceMappingURL=userSchema.js.map