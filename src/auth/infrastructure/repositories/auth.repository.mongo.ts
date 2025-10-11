import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { User } from '../../../users/domain/entities/user.entity';
import { User as UserSchema, UserDocument } from '../../../users/infrastructure/schemas/user/user.schema';
import { UserMapper } from '../../../users/infrastructure/mappers/user.mapper';

@Injectable()
export class AuthRepositoryMongo implements AuthRepository {
    constructor(
        @InjectModel(UserSchema.name) private readonly userModel: Model<UserDocument>,
    ) {}

    async findUserByEmail(email: string): Promise<User | null> {
        const userDoc = await this.userModel.findOne({ email }).exec();
        return userDoc ? UserMapper.toDomain(userDoc) : null;
    }

    async createUser(user: User): Promise<User> {
        const toSave = UserMapper.toPersistence(user);
        const created = new this.userModel(toSave);
        const saved = await created.save();
        return UserMapper.toDomain(saved);
    }
}