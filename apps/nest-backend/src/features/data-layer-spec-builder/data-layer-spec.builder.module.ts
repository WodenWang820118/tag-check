import { Module } from '@nestjs/common';
import { DataLayerSpecBuilderService } from './data-layer-spec.builder.service';

const services = [DataLayerSpecBuilderService];

@Module({
  imports: [],
  providers: [...services],
  exports: [...services]
})
export class DataLayerSpecBuilderModule {}
