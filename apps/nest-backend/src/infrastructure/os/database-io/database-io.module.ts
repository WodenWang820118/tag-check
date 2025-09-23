import { Module } from '@nestjs/common';
import { DatabaseIoService } from './database-io.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseImportService } from './database-import.service';
import { DatabaseDumpOrchestratorService } from './database-dump-orchestrator.service';
import { DatabaseSchemaDumpService } from './database-schema-dump.service';
import { DatabaseDataDumpService } from './database-data-dump.service';
import { DatabaseSerializationService } from './database-serialization.service';
import { SqlIdempotencyService } from './sql-idempotency.service';
import { SqlStatementParserService } from './sql-statement-parser.service';
import { SqlUtilsService } from './sql-utils.service';
import { InsertRewriterService } from './insert-rewriter.service';
import { SqlExecutorService } from './sql-executor.service';

const services = [
  DatabaseIoService,
  DatabaseImportService,
  DatabaseDumpOrchestratorService,
  DatabaseSchemaDumpService,
  DatabaseDataDumpService,
  DatabaseSerializationService,
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
