"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProfileSchema = void 0;
const zod_1 = require("zod");
exports.UpdateProfileSchema = zod_1.z.object({
    displayName: zod_1.z
        .string()
        .min(3, 'displayName must be >= 3 characters')
        .max(24, 'displayName must be <= 24 characters')
        .regex(/^[A-Za-z0-9_.\- ]+$/, 'displayName has invalid characters')
        .optional(),
    avatarKey: zod_1.z.string().max(64).optional(),
    preferredLanguage: zod_1.z.string().length(2).optional(),
});
//# sourceMappingURL=users.dto.js.map