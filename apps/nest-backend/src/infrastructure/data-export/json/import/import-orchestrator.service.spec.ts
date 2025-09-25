import { readFileSync } from 'fs';
import { join } from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ProjectEntity,
  TestEventEntity,
  SpecEntity,
  RecordingEntity,
  ItemDefEntity,
  TestEventDetailEntity,
  TestImageEntity,
  AuthenticationSettingEntity,
  BrowserSettingEntity,
  ApplicationSettingEntity,
  SysConfigurationEntity
} from '../../../../shared';
import { ImportOrchestrator } from './import-orchestrator.service';
import { ImportTransactionService } from '../core/import-transaction.service';
import { TopologicalSorterService } from '../core/topological-sorter.service';
import { PointerRepairService } from '../core/pointer-repair.service';
import { IdMapRegistryService } from '../core/id-map-registry.service';
import { EntityImportService } from '../core/entity-import.service';
import { RowMaterializerService } from '../core/row-materializer.service';
import { RelationMapperService } from '../core/relation-mapper.service';
import { ProjectSlugService } from '../core/project-slug.service';
import { PrimaryKeyService } from '../core/primary-key.service';
import { ProjectImportService } from '../core/project-import.service';
import { TestEventDuplicateService } from '../core/test-event-duplicate.service';
import { EntityPersistenceService } from '../core/entity-persistence.service';
import { ImportRowProcessorService } from '../core/import-row-processor.service';
import { JsonProjectImportService } from './json-project-import.service';
import { FixtureEnvelopeV1 } from '../../interfaces/fixture-types';
import { DataSource } from 'typeorm';

// NOTE: This test focuses on ensuring that the import orchestrator brings in all entity rows
// from the example fixture, not just the ProjectEntity.

const entityList = [
  ProjectEntity,
  TestEventEntity,
  SpecEntity,
  RecordingEntity,
  ItemDefEntity,
  TestEventDetailEntity,
  TestImageEntity,
  AuthenticationSettingEntity,
  BrowserSettingEntity,
  ApplicationSettingEntity,
  SysConfigurationEntity
];

describe('ImportOrchestrator (fixture integration)', () => {
  let moduleRef: TestingModule;
  let txService: ImportTransactionService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          // Use a unique in-memory DB per test module
          database: ':memory:',
          entities: entityList,
          dropSchema: true,
          synchronize: true,
          logging: false
        }),
        TypeOrmModule.forFeature(entityList)
      ],
      providers: [
        // Orchestrator + supporting services
        ImportOrchestrator,
        ImportTransactionService,
        TopologicalSorterService,
        PointerRepairService,
        IdMapRegistryService,
        EntityImportService,
        RowMaterializerService,
        RelationMapperService,
        ProjectSlugService,
        PrimaryKeyService,
        ProjectImportService,
        TestEventDuplicateService,
        EntityPersistenceService,
        ImportRowProcessorService,
        JsonProjectImportService
      ]
    }).compile();
    txService = moduleRef.get(ImportTransactionService);
  });

  afterAll(async () => {
    await moduleRef?.close();
  });

  it('imports all entity rows from the example fixture', async () => {
    try {
      const fixturePath = join(
        __dirname,
        '..',
        'example-project-slug.fixture.json'
      );
      const raw = readFileSync(fixturePath, 'utf-8');
      const env = JSON.parse(raw) as FixtureEnvelopeV1;

      const { stats } = await txService.runWithinTransaction(env);
      console.log('Import stats:', stats);

      const ds = moduleRef.get(DataSource);

      // Helper to get count for an entity by class
      type Ctor<T> = new (...args: unknown[]) => T;
      const countFor = async <T>(cls: Ctor<T>) => ds.getRepository(cls).count();

      // Project should be created exactly once
      await expect(countFor(ProjectEntity)).resolves.toBe(1);

      // Settings each 1
      await expect(countFor(AuthenticationSettingEntity)).resolves.toBe(1);
      await expect(countFor(BrowserSettingEntity)).resolves.toBe(1);
      await expect(countFor(ApplicationSettingEntity)).resolves.toBe(1);

      // Recording + ItemDef counts should match fixture lengths
      const recordingLen = env.entities['RecordingEntity']?.length ?? 0;
      const itemDefLen = env.entities['ItemDefEntity']?.length ?? 0;
      await expect(countFor(RecordingEntity)).resolves.toBe(recordingLen);
      await expect(countFor(ItemDefEntity)).resolves.toBe(itemDefLen);

      // Test events count
      const testEventLen = env.entities['TestEventEntity']?.length ?? 0;
      await expect(countFor(TestEventEntity)).resolves.toBe(testEventLen);
    } catch (err) {
      console.error('Import orchestrator test failed:', err);
      throw err;
    }
  });
});
