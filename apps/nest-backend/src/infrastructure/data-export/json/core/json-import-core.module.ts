import { Module } from '@nestjs/common';
import { TopologicalSorterService } from './topological-sorter.service';
import { RowMaterializerService } from './row-materializer.service';
import { RelationMapperService } from './relation-mapper.service';
import { PointerRepairService } from './pointer-repair.service';
import { IdMapRegistryService } from './id-map-registry.service';
import { ProjectSlugService } from './project-slug.service';
import { EntityImportService } from './entity-import.service';
import { PrimaryKeyService } from './primary-key.service';
import { ProjectImportService } from './project-import.service';
import { TestEventDuplicateService } from './test-event-duplicate.service';
import { EntityPersistenceService } from './entity-persistence.service';
import { ImportTransactionService } from './import-transaction.service';

@Module({
  providers: [
    TopologicalSorterService,
    RowMaterializerService,
    RelationMapperService,
    PointerRepairService,
    IdMapRegistryService,
    ProjectSlugService,
    EntityImportService,
    PrimaryKeyService,
    ProjectImportService,
    TestEventDuplicateService,
    EntityPersistenceService,
    ImportTransactionService
  ],
  exports: [
    TopologicalSorterService,
    RowMaterializerService,
    RelationMapperService,
    PointerRepairService,
    IdMapRegistryService,
    ProjectSlugService,
    EntityImportService,
    PrimaryKeyService,
    ProjectImportService,
    TestEventDuplicateService,
    EntityPersistenceService,
    ImportTransactionService
  ]
})
export class JsonImportCoreModule {}
