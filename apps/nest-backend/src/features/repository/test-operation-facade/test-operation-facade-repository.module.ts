import { Module } from '@nestjs/common';
import { RepositoryModule } from '../../../core/repository/repository.module';
import { TestOperationFacadeRepositoryService } from './test-operation-facade-repository.service';

const modules = [RepositoryModule];
const services = [TestOperationFacadeRepositoryService];

@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...modules, ...services]
})
export class TestOperationFacadeRepositoryModule {}
