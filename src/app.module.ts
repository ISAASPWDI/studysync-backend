import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { MatchesModule } from './matches/matches.module';
import { SwipeModule } from './swipe/swipe.module';
import { MessagesModule } from './messages/messages.module';
import { JwtConfigModule } from './shared/jwt/jwt.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    UsersModule, 
    MongooseModule.forRoot(process.env.MONGODB_URI!), AuthModule, MatchesModule, SwipeModule, MessagesModule, JwtConfigModule
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {
  
}
