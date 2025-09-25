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
}
interface TestEventRow {
  id: number;
  eventId: string;
  projectId?: number;
  projectSlug?: string;
}

class MemRepo<T extends Record<string, unknown>> {
  rows: T[] = [];
  constructor(private pk: keyof T) {}
  create(o: T): T {
    return { ...o };
  }
  async save(o: T): Promise<T> {
    if (o[this.pk] == null) {
      (o as Record<string, unknown>)[this.pk as string] = this.rows.length + 1;
    }
    const idx = this.rows.findIndex((r) => r[this.pk] === o[this.pk]);
    if (idx >= 0) this.rows[idx] = o;
    else this.rows.push(o);
    return o;
  }
  async find(opts?: { select?: string[] }): Promise<Partial<T>[]> {
    if (!opts?.select) return this.rows;
    const selected = opts.select;
    return this.rows.map((r) => {
      const sub: Partial<T> = {};
      for (const k of selected)
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
class PassMaterializer extends RowMaterializerService {
  materialize<R extends Record<string, unknown>>(r: R): R {
    return { ...r };
  }
}
class SlugService extends ProjectSlugService {
  private used = new Set<string>();
  async ensureUnique(
    repo: { rows?: Array<Record<string, unknown>> },
    slug: string
  ) {
    if (Array.isArray(repo?.rows)) {
      for (const r of repo.rows) {
        const existing = r['projectSlug'];
        if (typeof existing === 'string') this.used.add(existing);
      }
    }
    let candidate = slug;
    let i = 2;
    while (this.used.has(candidate)) candidate = `${slug}-${i++}`;
    this.used.add(candidate);
    return candidate;
  }
}

const projectMeta = {
  name: 'ProjectEntity',
  primaryColumns: [{ propertyName: 'id' } as PrimaryColumnLike],
  relations: []
} as unknown as EntityMetadata;
const testEventMeta = {
  name: 'TestEventEntity',
  primaryColumns: [{ propertyName: 'id' } as PrimaryColumnLike],
  relations: [
    {
      isManyToOne: true,
      propertyName: 'project',
      joinColumns: [{ propertyName: 'projectId' }],
      inverseEntityMetadata: { name: 'ProjectEntity' }
    }
  ]
} as unknown as EntityMetadata;

describe('EntityImportService duplicate project test events (composite uniqueness)', () => {
  let service: EntityImportService;
  let relationMapper: RelationMapperService;
  let idMap: IdMapRegistryService;
  let projectRepo: MemRepo<ProjectRow>;
  let eventRepo: MemRepo<TestEventRow>;

  beforeEach(() => {
    relationMapper = new RelationMapperService();
    idMap = new IdMapRegistryService();
    const materializer =
      new PassMaterializer() as unknown as RowMaterializerService;
    const slugSvc = new SlugService() as unknown as ProjectSlugService;
    const pkSvc = new PrimaryKeyService();
    const projImporter = new ProjectImportService(
      materializer,
      slugSvc,
      idMap,
      relationMapper
    );
    const testEventDup = new TestEventDuplicateService(idMap);
    const entityPersistence = new EntityPersistenceService(
      relationMapper,
      idMap
    );
    service = new EntityImportService(
      materializer,
      relationMapper,
      idMap,
      pkSvc,
      projImporter,
      testEventDup,
      entityPersistence
    );
    projectRepo = new MemRepo<ProjectRow>('id');
    eventRepo = new MemRepo<TestEventRow>('id');
    // Existing project so incoming slug mutates
    projectRepo.rows.push({ id: 1, projectSlug: 'proj' });
    // Existing events belonging to original project
    eventRepo.rows.push({ id: 1, eventId: 'E1', projectId: 1 });
  });

  it('updates duplicate project slug (no new project) and allows importing duplicate event rows (same eventId different original pk) as new rows', async () => {
    const exportedProjects: ProjectRow[] = [{ id: 99, projectSlug: 'proj' }];
    const exportedEvents: TestEventRow[] = [
      { id: 201, eventId: 'E1', projectId: 99 }, // duplicate composite -> skipped
      { id: 202, eventId: 'E2', projectId: 99 } // new eventId -> inserted
    ];

    const ctx = {
      exportedProjectId: 99,
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
      'TestEventEntity',
      exportedEvents,
      testEventMeta,
      eventRepo as unknown as Repository<TestEventRow>,
      ctx
    );

    // Still single project (updated in place)
    expect(projectRepo.rows.length).toBe(1);
    expect(newProjId).toBe(1);
    // Events: original E1 plus duplicate imported E1 and E2
    const allE1 = eventRepo.rows.filter((e) => e.eventId === 'E1');
    expect(allE1.length).toBe(2);
    const e2 = eventRepo.rows.find((e) => e.eventId === 'E2');
    expect(e2).toBeDefined();
  });
});
