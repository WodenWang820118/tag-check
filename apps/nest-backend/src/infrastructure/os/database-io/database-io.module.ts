import { Module } from '@nestjs/common';
import { DatabaseIoService } from './database-io.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseImportService } from './database-import.service';
import { DatabaseDumpService } from './database-dump.service';
import { SqlIdempotencyService } from './sql-idempotency.service';
import { SqlStatementParserService } from './sql-statement-parser.service';
import { SqlUtilsService } from './sql-utils.service';
import { InsertRewriterService } from './insert-rewriter.service';
import { SqlExecutorService } from './sql-executor.service';

const services = [
  DatabaseIoService,
  DatabaseImportService,
  DatabaseDumpService,
  SqlIdempotencyService,
  SqlStatementParserService,
  SqlUtilsService,
  InsertRewriterService,
  SqlExecutorService
];

@Module({
  imports: [TypeOrmModule.forFeature()],
  providers: [...services],
  exports: [...services]
})
export class DatabaseIoModule {}
