import { describe, it, expect, beforeEach } from 'vitest';
import { EntityImportService } from '../entity-import.service';
import { RelationMapperService } from '../relation-mapper.service';
import { IdMapRegistryService } from '../id-map-registry.service';
import { RowMaterializerService } from '../row-materializer.service';
import { ProjectSlugService } from '../project-slug.service';
import { PrimaryKeyService } from '../primary-key.service';
import { ProjectImportService } from '../project-import.service';
import { TestEventDuplicateService } from '../test-event-duplicate.service';
import { EntityPersistenceService } from '../entity-persistence.service';
import { EntityMetadata, Repository } from 'typeorm';

interface PrimaryColumnLike {
  propertyName: string;
}
interface ProjectRow {
  id: number;
  projectSlug: string;
  __exportRef?: string;
}
interface ChildRow {
  id: number;
  value: string;
  projectExportRef?: string;
  project?: { __exportRef?: string; id?: number };
  projectId?: number;
}

// Narrow fake repo not pretending full TypeORM signatures
class SimpleRepo<T extends Record<string, unknown>> {
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
    const sel = opts.select;
    return this.rows.map((r) => {
      const sub: Partial<T> = {};
      for (const k of sel)
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

class SimpleMaterializer extends RowMaterializerService {
  materialize<R extends Record<string, unknown>>(row: R): R {
    return { ...row };
  }
}
class SimpleSlugService extends ProjectSlugService {
  private used = new Set<string>();
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
    while (this.used.has(c)) {
      c = `${slug}-${i++}`;
    }
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

describe('EntityImportService __exportRef mapping', () => {
  let service: EntityImportService;
  let relationMapper: RelationMapperService;
  let idMapRegistry: IdMapRegistryService;
  let projectRepo: SimpleRepo<ProjectRow>;
  let childRepo: SimpleRepo<ChildRow>;

  beforeEach(() => {
    relationMapper = new RelationMapperService();
    idMapRegistry = new IdMapRegistryService();
    const materializer =
      new SimpleMaterializer() as unknown as RowMaterializerService;
    const slugSvc = new SimpleSlugService() as unknown as ProjectSlugService;
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
    service = new EntityImportService(
      materializer,
      relationMapper,
      idMapRegistry,
      pkSvc,
      projImporter,
      testEventDup,
      entityPersistence
    );
    projectRepo = new SimpleRepo<ProjectRow>('id');
    childRepo = new SimpleRepo<ChildRow>('id');
    projectRepo.rows.push({ id: 1, projectSlug: 'demo-project' });
  });

  it('maps child via projectExportRef field', async () => {
    const exportedProjects: ProjectRow[] = [
      { id: 1, projectSlug: 'demo-project', __exportRef: 'proj-A' }
    ];
    const exportedChildren: ChildRow[] = [
      { id: 11, value: 'child-a', projectExportRef: 'proj-A' }
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
    await service.importEntitiesFor(
      'ChildEntity',
      exportedChildren,
      childMeta,
      childRepo as unknown as Repository<ChildRow>,
      ctx
    );
    expect(newProjId).toBe(1); // updated existing project, no new project row
    expect(projectRepo.rows.length).toBe(1);
    expect(childRepo.rows.length).toBe(1);
    expect(childRepo.rows[0].projectId).toBe(1);
  });

  it('maps child via embedded project object with __exportRef', async () => {
    const exportedProjects: ProjectRow[] = [
      { id: 1, projectSlug: 'demo-project', __exportRef: 'proj-B' }
    ];
    const exportedChildren: ChildRow[] = [
      { id: 12, value: 'child-b', project: { __exportRef: 'proj-B' } }
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
    await service.importEntitiesFor(
      'ChildEntity',
      exportedChildren,
      childMeta,
      childRepo as unknown as Repository<ChildRow>,
      ctx
    );
    expect(newProjId).toBe(1);
    expect(projectRepo.rows.length).toBe(1);
    expect(childRepo.rows.length).toBe(1);
    expect(childRepo.rows[0].projectId).toBe(1);
  });
});
