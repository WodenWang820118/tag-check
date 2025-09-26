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
  value: string;
  projectSlug?: string;
  projectId?: number;
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
    if (obj[this.pk] == null)
      (obj as Record<string, unknown>)[this.pk as string] =
        this.rows.length + 1;
    const idx = this.rows.findIndex((r) => r[this.pk] === obj[this.pk]);
    if (idx >= 0) this.rows[idx] = obj;
    else this.rows.push(obj);
    return obj;
  }
  async find(opts?: { select?: string[] }): Promise<Partial<T>[]> {
    if (!opts?.select) return this.rows;
    const subSel = opts.select;
    return this.rows.map((r) => {
      const sub: Partial<T> = {};
      for (const k of subSel)
        if (k in r) (sub as Record<string, unknown>)[k] = r[k];
      return sub;
    });
  }
  async findOne(opts: { where: Partial<T> }): Promise<T | null> {
    const keys = Object.keys(opts.where || {}) as (keyof T)[];
    return (
      this.rows.find((r) => keys.every((k) => r[k] === opts.where[k])) ?? null
    );
  }
}
class FakeMaterializer extends RowMaterializerService {
  materialize<R extends Record<string, unknown>>(row: R): R {
    return { ...row };
  }
}
class FakeProjectSlugService extends ProjectSlugService {
  private readonly used = new Set<string>();
  async ensureUnique(repo: unknown, slug: string) {
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
    let c = slug;
    let i = 2;
    while (this.used.has(c)) c = `${slug}-${i++}`;
    this.used.add(c);
    return c;
  }
}

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

describe('EntityImportService slug alternate key mapping', () => {
  let service: EntityImportService;
  let relationMapper: RelationMapperService;
  let idMapRegistry: IdMapRegistryService;
  let projectRepo: FakeRepo<ProjectRow>;
  let childRepo: FakeRepo<ChildRow>;

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
      pkSvc,
      projImporter,
      testEventDup,
      entityPersistence,
      rowProcessor
    );
    projectRepo = new FakeRepo<ProjectRow>('id');
    childRepo = new FakeRepo<ChildRow>('id');
    // Existing conflicting project
    projectRepo.rows.push({ id: 1, projectSlug: 'project-alpha' });
  });

  it('maps child referencing slug to existing project id after update (no new project row)', async () => {
    const exportedProjects: ProjectRow[] = [
      { id: 1, projectSlug: 'project-alpha' }
    ];
    // Child references by slug only
    const exportedChildren: ChildRow[] = [
      { id: 10, value: 'child-x', projectSlug: 'project-alpha' }
    ];
    const ctx = {
      exportedProjectId: 1,
      newProjectId: undefined as unknown,
      stats: {} as Record<string, { inserted: number; skipped: number }>,
      idMaps: {} as Record<string, Map<unknown, unknown>>
    };

    const newProjId = await service.importEntitiesFor(
      'ProjectEntity',
      exportedProjects,
      projectMeta,
      projectRepo as unknown as Repository<ProjectRow>,
      ctx
    );
    ctx.newProjectId = newProjId;
    // Before importing children, manually simulate relation mapper usage: we rely on slug registration from project import patch
    // Child entity still has old slug; materializer will leave it. We adapt import to test mapping.
    await service.importEntitiesFor(
      'ChildEntity',
      exportedChildren,
      childMeta,
      childRepo as unknown as Repository<ChildRow>,
      ctx
    );

    expect(projectRepo.rows.length).toBe(1);
    expect(newProjId).toBe(1);
    expect(childRepo.rows.length).toBe(1);
    expect(childRepo.rows[0].projectId).toBe(1);
  });
});
