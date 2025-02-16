import { Module } from '@nestjs/common';
import { ProjectFacadeRepositoryModule } from './project-facade/project-facade-repository.module';
import { TestOperationFacadeRepositoryModule } from './test-operation-facade/test-operation-facade-repository.module';
import { TestReportFacadeModule } from './test-report-facade/test-report-facade.module';

const modules = [
  ProjectFacadeRepositoryModule,
  TestOperationFacadeRepositoryModule,
  TestReportFacadeModule
];
@Module({
  imports: [...modules],
  exports: [...modules]
})
export class FacadeRepositoryModule {}
