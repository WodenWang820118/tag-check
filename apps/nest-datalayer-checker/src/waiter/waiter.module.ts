import { Module } from '@nestjs/common';
import { WaiterController } from './waiter.controller';
import { WaiterService } from './waiter.service';
import { SharedModule } from '../shared/shared.module';
import { SharedService } from '../shared/shared.service';
import { FileModule } from '../shared/file/file.module';
import { FileService } from '../shared/file/file.service';
@Module({
  imports: [SharedModule, FileModule],
  controllers: [WaiterController],
  providers: [WaiterService, SharedService, FileService],
})
export class WaiterModule {}
