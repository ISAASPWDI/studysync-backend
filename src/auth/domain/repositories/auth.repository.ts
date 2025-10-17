import { User } from '../../../users/domain/entities/user.entity';

export abstract class AuthRepository {
    abstract findUserByEmail(email: string): Promise<User | null>;
    abstract createUser(user: User): Promise<User>;
    abstract addToBlacklist(token: string, expiresInSeconds: number): Promise<void>;
    abstract isBlacklisted(token: string): Promise<boolean>;
    abstract cleanupExpiredTokens(): Promise<void>;
}