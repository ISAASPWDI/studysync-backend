import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './infrastructure/schemas/user/user.schema';
import { UsersService } from './application/users.service';
import { UserRepositoryMongo } from './infrastructure/repositories/user.repository.mongo';
import { UserRepository } from './domain/repositories/user.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema
      }
    ])
  ],
  controllers: [UsersController],
  providers: [
    UsersService, 
    {
      provide: UserRepository,
      useClass: UserRepositoryMongo
    }
  ],
  exports: [UserRepository],
})
export class UsersModule {

}
