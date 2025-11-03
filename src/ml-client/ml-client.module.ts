import { Module } from '@nestjs/common';
import { MlClientService } from './ml-client.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ConfigModule,
    HttpModule
  ],
  providers: [MlClientService],
  exports: [MlClientService]
})
export class MlClientModule { }
