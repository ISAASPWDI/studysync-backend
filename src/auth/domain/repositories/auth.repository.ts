import { User } from '../../../users/domain/entities/user.entity';

export abstract class AuthRepository {
    abstract findUserByEmail(email: string): Promise<User | null>;
    abstract createUser(user: User): Promise<User>;
}