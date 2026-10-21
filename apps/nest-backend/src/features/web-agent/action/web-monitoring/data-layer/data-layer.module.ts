import { Module } from '@nestjs/common';
import { DataLayerService } from './data-layer.service';
import { OsModule } from '../../../../../infrastructure/os/os.module';

@Module({
  // Data access through OsModule, the features' data-access layer.
  imports: [OsModule],
  providers: [DataLayerService],
  exports: [DataLayerService]
})
export class DataLayerModule {}
