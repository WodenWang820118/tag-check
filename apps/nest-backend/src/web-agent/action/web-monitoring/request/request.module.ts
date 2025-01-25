import { Module } from '@nestjs/common';
import { RequestService } from './request.service';
import { ConfigsModule } from '../../../../core/configs/configs.module';
import { ConfigsService } from '../../../../core/configs/configs.service';

@Module({
  providers: [RequestService, ConfigsModule, ConfigsService],
  exports: [RequestService, ConfigsModule, ConfigsService]
})
export class RequestModule {}
