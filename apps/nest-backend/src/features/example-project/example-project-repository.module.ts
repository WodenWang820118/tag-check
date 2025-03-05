import { Module } from '@nestjs/common';
import { ExampleProjectRepositoryService } from './example-project-repository.service';
import { FacadeRepositoryModule } from '../repository/facade-respository.module';
import { RepositoryModule } from '../../core/repository/repository.module';
import { TestReportFacadeRepositoryService } from '../repository/test-report-facade/test-report-facade-repository.service';

const modules = [FacadeRepositoryModule, RepositoryModule];
const services = [TestReportFacadeRepositoryService];

@Module({
  imports: [...modules],
  providers: [ExampleProjectRepositoryService, ...services],
  exports: [ExampleProjectRepositoryService, ...modules, ...services]
})
export class ExampleProjectRepositoryModule {}
