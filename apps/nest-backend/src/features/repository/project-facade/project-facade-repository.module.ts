import { RepositoryModule } from '../../../core/repository/repository.module';
import { ProjectFacadeRepositoryService } from './project-facade-repository.service';
import { Module } from '@nestjs/common';

const modules = [RepositoryModule];
const services = [ProjectFacadeRepositoryService];

@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...modules, ...services]
})
export class ProjectFacadeRepositoryModule {}
