import { EntityImportService } from './entity-import.service';
import { RowMaterializerService } from './row-materializer.service';
import { RelationMapperService } from './relation-mapper.service';
import { PrimaryKeyService } from './primary-key.service';
import { ProjectImportService } from './project-import.service';
import { TestEventDuplicateService } from './test-event-duplicate.service';
import { EntityPersistenceService } from './entity-persistence.service';
import { ImportRowProcessorService } from './import-row-processor.service';
import {
  DataSource,
  EntityManager,
  EntityMetadata,
  ObjectLiteral,
  Repository
} from 'typeorm';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Minimal helper to craft metadata
function meta(name: string, primary: string | string[] = 'id'): EntityMetadata {
  const primaryColumns = (Array.isArray(primary) ? primary : [primary]).map(
    (propertyName) => ({
      propertyName,
      isPrimary: true
    })
  );
  return {
    name,
    tableName: name.toLowerCase(),
    columns: primaryColumns,
    relations: []
  } as unknown as EntityMetadata;
}

describe('EntityImportService (unit)', () => {
  let service: EntityImportService;
  // dependency mocks
  let materializer: RowMaterializerService;
  let relationMapper: RelationMapperService;
  let pkService: PrimaryKeyService;
  let projectImporter: ProjectImportService;
  let dupService: TestEventDuplicateService;
  let persistence: EntityPersistenceService;
  let rowProcessor: ImportRowProcessorService;

  // common fakes
  let repo: Repository<ObjectLiteral>;
  let stats: Record<string, { inserted: number; skipped: number }>;
  let idMaps: Record<string, Map<unknown, unknown>>;

  beforeEach(() => {
    materializer = {
      materialize: (r: unknown) => r
    } as unknown as RowMaterializerService;
    relationMapper = {
      mapRelations: vi.fn()
    } as unknown as RelationMapperService;
    pkService = {
      getPrimaryKeyInfo: (m: EntityMetadata) => ({
        primaryIsSingle: m.columns.length === 1,
        primaryKeyProp:
          m.columns.length === 1
            ? (m.columns[0] as { propertyName: string }).propertyName
            : undefined
      })
    } as unknown as PrimaryKeyService;
    projectImporter = {
      importProjectRows: vi.fn(
        async (
          rows: unknown[],
          _meta: EntityMetadata,
          _repo: Repository<ObjectLiteral>,
          _pk: unknown,
          s: { inserted: number; skipped: number }
        ) => {
          s.inserted += rows.length;
          return 123; // new project id
        }
      )
    } as unknown as ProjectImportService;
    dupService = {
      prefetchExistingComposite: vi.fn(async () => new Map())
    } as unknown as TestEventDuplicateService;
    persistence = {
      persistEntityAndRegister: vi.fn(
        async (
          _meta: EntityMetadata,
          _repo: Repository<ObjectLiteral>,
          materialized: Record<string, unknown>,
          _pkInfo: unknown,
          opts: {
            existingIds: Set<unknown> | null;
            stats: { inserted: number; skipped: number };
          }
        ) => {
          opts.stats.inserted += 1;
          if (opts.existingIds) opts.existingIds.add(materialized.id);
        }
      )
    } as unknown as EntityPersistenceService;
    rowProcessor = {
      preProcessRow: vi.fn(async () => false)
    } as unknown as ImportRowProcessorService;

    service = new EntityImportService(
      materializer,
      relationMapper,
      pkService,
      projectImporter,
      dupService,
      persistence,
      rowProcessor
    );

    stats = {} as Record<string, { inserted: number; skipped: number }>;
    idMaps = {} as Record<string, Map<unknown, unknown>>;
    repo = {
      find: vi.fn(async () => [{ id: 1 }])
    } as unknown as Repository<ObjectLiteral>;
  });

  it('prefetchExistingIdsIfNeeded returns null when composite PK', async () => {
    const set = await service.prefetchExistingIdsIfNeeded(
      repo,
      'X',
      false,
      undefined
    );
    expect(set).toBeNull();
  });

  it('prefetchExistingIdsIfNeeded returns Set for single PK', async () => {
    const result = await service.prefetchExistingIdsIfNeeded(
      repo,
      'X',
      true,
      'id'
    );
    expect(result).toBeInstanceOf(Set);
    expect(result?.has(1)).toBe(true);
  });

  it('importEntitiesFor short-circuits on empty rows', async () => {
    const m = meta('ChildEntity');
    const ctx = { exportedProjectId: 9, newProjectId: 9, stats, idMaps } as {
      exportedProjectId: number;
      newProjectId: number;
      stats: typeof stats;
      idMaps: typeof idMaps;
    };
    const ret = await service.importEntitiesFor(
      'ChildEntity',
      [],
      m,
      repo,
      ctx
    );
    expect(ret).toBe(9);
    expect(stats.ChildEntity).toBeUndefined();
  });

  it('importEntitiesFor handles project entity path', async () => {
    const projectMeta = meta('ProjectEntity');
    const ctx = {
      exportedProjectId: 9,
      newProjectId: undefined,
      stats,
      idMaps
    } as {
      exportedProjectId: number;
      newProjectId: number | undefined;
      stats: typeof stats;
      idMaps: typeof idMaps;
    };
    const ret = await service.importEntitiesFor(
      'ProjectEntity',
      [{ id: 5 }],
      projectMeta,
      repo,
      ctx
    );
    expect(projectImporter.importProjectRows).toHaveBeenCalled();
    expect(ret).toBe(123); // new project id propagated
  });

  it('importEntitiesFor processes normal entity rows and persists', async () => {
    const m = meta('ChildEntity');
    const ctx = { exportedProjectId: 9, newProjectId: 9, stats, idMaps } as {
      exportedProjectId: number;
      newProjectId: number;
      stats: typeof stats;
      idMaps: typeof idMaps;
    };
    await service.importEntitiesFor('ChildEntity', [{ id: 2 }], m, repo, ctx);
    expect(persistence.persistEntityAndRegister).toHaveBeenCalledTimes(1);
    expect(stats.ChildEntity.inserted).toBe(1);
  });

  it('processRow respects skip from rowProcessor', async () => {
    (
      rowProcessor.preProcessRow as unknown as {
        mockResolvedValueOnce: (v: boolean) => void;
      }
    ).mockResolvedValueOnce(true);
    const m = meta('ChildEntity');
    const ctx = { exportedProjectId: 9, newProjectId: 9, stats, idMaps } as {
      exportedProjectId: number;
      newProjectId: number;
      stats: typeof stats;
      idMaps: typeof idMaps;
    };
    await service.importEntitiesFor('ChildEntity', [{ id: 222 }], m, repo, ctx);
    expect(persistence.persistEntityAndRegister).not.toHaveBeenCalled();
    expect(stats.ChildEntity.skipped + stats.ChildEntity.inserted).toBe(0); // our mock does not increment skipped currently
  });

  it('runInTransaction executes non-transactionally when datasource absent', async () => {
    const result = await service.runInTransaction(undefined, async () => 42);
    expect(result).toBe(42);
  });

  it('runInTransaction uses provided datasource transaction', async () => {
    const txFn = vi.fn(async (fn: (m: EntityManager) => Promise<unknown>) =>
      fn({} as EntityManager)
    );
    const ds = { transaction: txFn } as unknown as DataSource;
    const result = await service.runInTransaction(ds, async (m) => {
      expect(m).toBeDefined();
      return 77;
    });
    expect(result).toBe(77);
    expect(txFn).toHaveBeenCalled();
  });
});
