import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './application/auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/users/infrastructure/schemas/user/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './infrastructure/strategies/local.strategy';
import { UsersModule } from 'src/users/users.module';
import { AuthRepository } from './domain/repositories/auth.repository';
import { AuthRepositoryMongo } from './infrastructure/repositories/auth.repository.mongo';
import { GoogleStrategy } from './infrastructure/strategies/google.strategy';
import { GoogleAuthService } from './infrastructure/adapters/google-auth-service';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';


@Module({
  imports: [
    UsersModule,
    PassportModule,
    ConfigModule,
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema
      }
    ]),
    JwtModule.register({
      secret: "abc123", //falta reemplazar por uno seguro y ponerlo en el .env
      signOptions: { expiresIn: "7d" }
    })
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    {
      provide: AuthRepository,
      useClass: AuthRepositoryMongo,
    },
    GoogleStrategy,
    JwtStrategy,
    GoogleAuthService
  ]
})
export class AuthModule { }
