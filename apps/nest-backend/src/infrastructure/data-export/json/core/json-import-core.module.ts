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
import { ImportRowProcessorService } from './import-row-processor.service';
import { ImportTransactionService } from './import-transaction.service';
import { SinglePerParentUpsertService } from './single-per-parent-upsert.service';

@Module({
  providers: [
    TopologicalSorterService,
    RowMaterializerService,
    RelationMapperService,
    PointerRepairService,
    IdMapRegistryService,
    ProjectSlugService,
    EntityImportService,
    ImportRowProcessorService,
    PrimaryKeyService,
    ProjectImportService,
    TestEventDuplicateService,
    EntityPersistenceService,
    ImportTransactionService,
    SinglePerParentUpsertService
  ],
  exports: [
    TopologicalSorterService,
    RowMaterializerService,
    RelationMapperService,
    PointerRepairService,
    IdMapRegistryService,
    ProjectSlugService,
    EntityImportService,
    ImportRowProcessorService,
    PrimaryKeyService,
    ProjectImportService,
    TestEventDuplicateService,
    EntityPersistenceService,
    ImportTransactionService,
    SinglePerParentUpsertService
  ]
})
export class JsonImportCoreModule {}
