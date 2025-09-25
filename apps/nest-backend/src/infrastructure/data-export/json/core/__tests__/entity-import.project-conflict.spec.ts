import { describe, it, expect, beforeEach } from 'vitest';
import { EntityImportService } from '../entity-import.service';
import { ImportRowProcessorService } from '../import-row-processor.service';
import { RelationMapperService } from '../relation-mapper.service';
import { IdMapRegistryService } from '../id-map-registry.service';
import { RowMaterializerService } from '../row-materializer.service';
import { ProjectSlugService } from '../project-slug.service';
import { PrimaryKeyService } from '../primary-key.service';
import { ProjectImportService } from '../project-import.service';
import { TestEventDuplicateService } from '../test-event-duplicate.service';
import { EntityPersistenceService } from '../entity-persistence.service';
import { Repository, EntityMetadata } from 'typeorm';

interface ProjectRow {
  id: number;
  projectSlug: string;
}
interface ChildRow {
  id: number;
  projectId: number;
  value: string;
}

interface PrimaryColumnLike {
  propertyName: string;
}

class FakeRepo<T extends { [k: string]: unknown }>
  implements Partial<Repository<T>>
{
  rows: T[] = [];
  constructor(private readonly pk: keyof T) {}
  create(obj: T): T {
    return { ...obj };
  }
  async save(obj: T): Promise<T> {
    if (obj[this.pk] == null) {
      (obj as Record<string, unknown>)[this.pk as string] =
        this.rows.length + 1;
    }
    const idx = this.rows.findIndex((r) => r[this.pk] === obj[this.pk]);
    if (idx >= 0) {
      this.rows[idx] = obj;
    } else {
      this.rows.push(obj);
    }
    return obj;
  }
  async find(opts?: { select?: string[] }): Promise<Partial<T>[]> {
    if (!opts?.select) return this.rows;
    const sel = opts.select ?? [];
    return this.rows.map((r) => {
      const sub: Partial<T> = {};
      for (const k of sel)
        if (k in r) (sub as Record<string, unknown>)[k] = r[k];
      return sub;
    });
  }
  async findOne(opts: { where: Partial<T> }): Promise<T | null> {
    if (!opts?.where) return null;
    const keys = Object.keys(opts.where) as (keyof T)[];
    return (
      this.rows.find((r) => keys.every((k) => r[k] === opts.where[k])) ?? null
    );
  }
}

class FakeMaterializer extends RowMaterializerService {
  materialize<Row extends Record<string, unknown>>(row: Row): Row {
    return { ...row };
  }
}

class FakeProjectSlugService extends ProjectSlugService {
  private used = new Set<string>();
  async ensureUnique(repo: unknown, slug: string): Promise<string> {
    // Seed used set from current repository rows (simulate real DB uniqueness check)
    try {
      const anyRepo = repo as { rows?: Array<Record<string, unknown>> };
      if (Array.isArray(anyRepo?.rows)) {
        for (const r of anyRepo.rows) {
          const existing = r['projectSlug'];
          if (typeof existing === 'string') this.used.add(existing);
        }
      }
    } catch {
      /* ignore */
    }
    let candidate = slug;
    let i = 2;
    while (this.used.has(candidate)) {
      candidate = `${slug}-${i++}`;
    }
    this.used.add(candidate);
    return candidate;
  }
}

describe('EntityImportService project slug conflict integration', () => {
  let service: EntityImportService;
  let relationMapper: RelationMapperService;
  let idMapRegistry: IdMapRegistryService;
  let projectRepo: FakeRepo<ProjectRow>;
  let childRepo: FakeRepo<ChildRow>;

  // Provide minimal metadata objects sufficient for the import logic paths exercised here.
  const projectMeta = {
    name: 'ProjectEntity',
    primaryColumns: [{ propertyName: 'id' } as PrimaryColumnLike],
    relations: []
  } as unknown as EntityMetadata;
  const childMeta = {
    name: 'ChildEntity',
    primaryColumns: [{ propertyName: 'id' } as PrimaryColumnLike],
    relations: []
  } as unknown as EntityMetadata;

  beforeEach(() => {
    relationMapper = new RelationMapperService();
    idMapRegistry = new IdMapRegistryService();
    const materializer =
      new FakeMaterializer() as unknown as RowMaterializerService;
    const slugSvc =
      new FakeProjectSlugService() as unknown as ProjectSlugService;
    const pkSvc = new PrimaryKeyService();
    const projImporter = new ProjectImportService(
      materializer,
      slugSvc,
      idMapRegistry,
      relationMapper
    );
    const testEventDup = new TestEventDuplicateService(idMapRegistry);
    const entityPersistence = new EntityPersistenceService(
      relationMapper,
      idMapRegistry
    );
    const rowProcessor = new ImportRowProcessorService(
      testEventDup,
      idMapRegistry
    );
    service = new EntityImportService(
      materializer,
      relationMapper,
      idMapRegistry,
      pkSvc,
      projImporter,
      testEventDup,
      entityPersistence,
      rowProcessor
    );
    projectRepo = new FakeRepo<ProjectRow>('id');
    childRepo = new FakeRepo<ChildRow>('id');
    projectRepo.rows.push({ id: 1, projectSlug: 'example-project-slug' });
  });

  it('updates existing project when slug conflict occurs and maps child to existing project id', async () => {
    const exportedProjectRows: ProjectRow[] = [
      { id: 1, projectSlug: 'example-project-slug' }
    ];
    const exportedChildRows: ChildRow[] = [
      { id: 10, projectId: 1, value: 'child-A' }
    ];

    const ctx = {
      exportedProjectId: 1,
      newProjectId: undefined as unknown,
      stats: {} as Record<string, { inserted: number; skipped: number }>,
      idMaps: {} as Record<string, Map<unknown, unknown>>
    };

    const newProjId = await service.importEntitiesFor(
      'ProjectEntity',
      exportedProjectRows,
      projectMeta,
      projectRepo as unknown as Repository<ProjectRow>,
      ctx
    );
    ctx.newProjectId = newProjId;
    await service.importEntitiesFor(
      'ChildEntity',
      exportedChildRows,
      childMeta,
      childRepo as unknown as Repository<ChildRow>,
      ctx
    );

    // No new project created – update path engaged
    expect(projectRepo.rows.length).toBe(1);
    expect(newProjId).toBe(1);
    expect(childRepo.rows.length).toBe(1);
    expect(childRepo.rows[0].projectId).toBe(1);
  });
});
