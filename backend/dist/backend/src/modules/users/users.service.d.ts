import type { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { type Clock } from '../../common/utils/clock';
export declare class UsersService {
    private readonly prisma;
    private readonly clock;
    constructor(prisma: PrismaService, clock: Clock);
    findById(userId: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    changeEmail(userId: string, newEmail: string): Promise<void>;
    deleteAccount(userId: string): Promise<{
        deleted: boolean;
    }>;
    getProfile(userId: string): Promise<Record<string, unknown>>;
    updateProfile(userId: string, dto: {
        displayName?: string;
        avatarKey?: string;
        preferredLanguage?: string;
    }): Promise<Record<string, unknown>>;
}
