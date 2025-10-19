import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';
import { UserDocument } from '../schemas/user/user.schema';
import { UserMapper } from '../mappers/user.mapper';
import { UpsertUserDTO } from '../dto/user/crud/upsert-user.dto';
import { UpdateGeneralProfileDTO } from '../dto/user/crud/update-user.dto';
import { UserHelpers } from '../helpers/userHelpers';
import { UpdateSkillsDTO } from '../dto/user/crud/update-skills-user.dto';
import { UpdateAvailabilityDTO } from '../dto/user/crud/update-availability-user.dto';

@Injectable()
export class UserRepositoryMongo implements UserRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) { }
  async isUserOnline(lastSeenAt: Date | null): Promise<boolean> {
    if (!lastSeenAt) return false;

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastSeenAt) > fiveMinutesAgo;
  }
  async updateLastSeen(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          'activity.lastSeenAt': new Date()
        }
      },
      { new: true }
    );
  }

  async findById(id: string): Promise<User | null> {
    const userDoc = await this.userModel.findById(id).exec();
    return userDoc ? UserMapper.toDomain(userDoc) : null;
  }
  async findByIdOrThrow(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new UnauthorizedException('El usuario no existe');
    }
    return user;
  }


  async findByEmail(email: string): Promise<User | null> {
    const userDoc = await this.userModel.findOne({ email }).exec();
    return userDoc ? UserMapper.toDomain(userDoc) : null;
  }

  async findByEmailOrThrow(email: string): Promise<User> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('El usuario no existe');
    }
    return user;
  }
  async create(user: User): Promise<User> {
    const toSave = UserMapper.toPersistence(user);
    const created = new this.userModel(toSave);
    const saved = await created.save();
    return UserMapper.toDomain(saved);
  }

  async update(userId: string, newUserInfo: UpsertUserDTO): Promise<User | null> {

    const userFinded = await this.findByIdOrThrow(userId);

    // ⭐ Merge: mantener datos existentes si no vienen nuevos
    const formattedUser = UserHelpers.buildUpdateUser(userFinded, newUserInfo);

    const toUpdate = UserMapper.toPersistence(formattedUser);

    const updated = await this.userModel
      .findByIdAndUpdate(userFinded.id, toUpdate, { new: true })
      .exec();
    return updated ? UserMapper.toDomain(updated) : null;
  }
  async updateProfile(userId: string, body: UpdateGeneralProfileDTO): Promise<User | null> {
    const userFinded = await this.findByIdOrThrow(userId);

    const { email } = body;

    const existsUser = await this.findByEmail(email);
    if (existsUser && existsUser.id !== userFinded.id) throw new UnauthorizedException('Ya existe un usuario con este email');
    // ⭐ Merge: mantener datos existentes si no vienen nuevos
    const formattedUser = UserHelpers.buildUpdateUser(userFinded, body);
    const toUpdate = UserMapper.toPersistence(formattedUser);

    const updated = await this.userModel
      .findByIdAndUpdate(userFinded.id, toUpdate, { new: true })
      .exec();

    return updated ? UserMapper.toDomain(updated) : null;
  }

  async updateSkills(userId: string, body: UpdateSkillsDTO): Promise<User | null> {
    const userFinded = await this.findByIdOrThrow(userId);

    const toUpdate = UserMapper.toSkillsPersistence(body);

    const updated = await this.userModel.findByIdAndUpdate(userFinded.id, toUpdate, { new: true });

    return updated ? UserMapper.toDomain(updated) : null;
  }

  async delete(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id).exec();
  }
  async updateAvailability(userId: string, newValues: UpdateAvailabilityDTO): Promise<User | null> {
    const userFinded = await this.findByIdOrThrow(userId);

    const toUpdate = UserMapper.toObjectivesPersistence(newValues.objectives!);

    const updated = await this.userModel.findByIdAndUpdate(userFinded.id, toUpdate, { new: true });

    return updated ? UserMapper.toDomain(updated) : null;
  }
}
