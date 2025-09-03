import { Module } from '@nestjs/common';
import { ProjectDataLayerSpecBuilderService } from './project-data-layer-spec.builder.service';

const services = [ProjectDataLayerSpecBuilderService];

@Module({
  imports: [],
  providers: [...services],
  exports: [...services]
})
export class ProjectDataLayerSpecBuilderModule {}
