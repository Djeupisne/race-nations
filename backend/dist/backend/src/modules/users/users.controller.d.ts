import type { Request } from 'express';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './users.dto';
interface AuthedRequest extends Request {
    user: {
        sub: string;
        role: string;
    };
}
export declare class UsersController {
    private readonly users;
    constructor(users: UsersService);
    me(req: AuthedRequest): Promise<Record<string, unknown>>;
    update(req: AuthedRequest, dto: UpdateProfileDto): Promise<Record<string, unknown>>;
}
export {};
