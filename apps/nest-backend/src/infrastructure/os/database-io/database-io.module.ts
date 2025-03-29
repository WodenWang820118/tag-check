import { Module } from '@nestjs/common';
import { DatabaseIoService } from './database-io.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseImportService } from './database-import.service';
import { DatabaseDumpService } from './database-dump.service';

const services = [
  DatabaseIoService,
  DatabaseImportService,
  DatabaseDumpService
];

@Module({
  imports: [TypeOrmModule.forFeature()],
  providers: [...services],
  exports: [...services]
})
export class DatabaseIoModule {}
