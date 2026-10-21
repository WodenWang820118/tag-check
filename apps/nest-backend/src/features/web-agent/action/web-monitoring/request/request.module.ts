import { Module } from '@nestjs/common';
import { RequestService } from './request.service';
import { ConfigsModule } from '../../../../../core/configs/configs.module';

@Module({
  imports: [ConfigsModule],
  providers: [RequestService],
  exports: [RequestService, ConfigsModule]
})
export class RequestModule {}
