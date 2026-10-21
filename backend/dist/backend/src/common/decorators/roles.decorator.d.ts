export type AppRole = 'PLAYER' | 'MODERATOR' | 'ADMIN' | 'SYSTEM';
export declare const ROLES_KEY = "auth:roles";
export declare const Roles: (...roles: AppRole[]) => import("@nestjs/common").CustomDecorator<string>;
