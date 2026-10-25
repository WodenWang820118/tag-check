import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatchRunEntity, BatchRunItemEntity } from '../../../shared';
import { BatchRunRepositoryService } from './batch-run-repository.service';

const modules = [
  TypeOrmModule.forFeature([BatchRunEntity, BatchRunItemEntity])
];
const services = [BatchRunRepositoryService];

@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...services, ...modules]
})
export class BatchRunRepositoryModule {}
