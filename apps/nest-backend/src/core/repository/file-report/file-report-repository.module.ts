import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileReportEntity, TestEventEntity } from '../../../shared';
import { FileReportRepositoryService } from './file-report-repository.service';

const modules = [TypeOrmModule.forFeature([FileReportEntity, TestEventEntity])];
const services = [FileReportRepositoryService];

@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...services, ...modules]
})
export class FileReportRepositoryModule {}
