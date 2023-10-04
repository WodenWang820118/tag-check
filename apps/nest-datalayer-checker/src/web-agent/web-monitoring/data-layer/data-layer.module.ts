import { Module } from '@nestjs/common';
import { DataLayerService } from './data-layer.service';
import { SharedModule } from '../../../shared/shared.module';

@Module({
  imports: [SharedModule],
  providers: [DataLayerService],
  exports: [DataLayerService],
})
export class DataLayerModule {}
