import { Module } from '@nestjs/common';
import { DatabaseConfigService } from './database.service';
import { ConfigsModule } from '../configs/configs.module';

@Module({
  imports: [ConfigsModule],
  providers: [DatabaseConfigService],
  exports: [DatabaseConfigService],
})
export class DatabaseConfigModule {}
