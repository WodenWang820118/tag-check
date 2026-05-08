import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImportRowProcessorService } from './import-row-processor.service';
import { TestEventDuplicateService } from './test-event-duplicate.service';
import { IdMapRegistryService } from './id-map-registry.service';
import { ProjectIdAssignerService } from './project-id-assigner.service';
import { ExistingIdCollisionService } from './existing-id-collision.service';
import type { EntityMetadata } from 'typeorm';

function makeMeta(name: string): EntityMetadata {
  return { name } as unknown as EntityMetadata;
}

function makeCtx() {
  return {
    exportedProjectId: 'proj-old',
    newProjectId: 'proj-new',
    stats: { Foo: { skipped: 0, inserted: 0, total: 0 } as never },
    idMaps: {} as Record<string, Map<unknown, unknown>>
  };
}

describe('ImportRowProcessorService', () => {
  let dup: TestEventDuplicateService;
  let registry: IdMapRegistryService;
  let assigner: ProjectIdAssignerService;
  let collision: ExistingIdCollisionService;

  beforeEach(() => {
    dup = {
      handleDuplicate: vi.fn(() => false)
    } as unknown as TestEventDuplicateService;
    const map = new Map<unknown, unknown>();
    registry = {
      ensure: vi.fn(() => map)
    } as unknown as IdMapRegistryService;
    assigner = {
      assignIfApplicable: vi.fn()
    } as unknown as ProjectIdAssignerService;
    collision = {
      handleCollision: vi.fn(() => true)
    } as unknown as ExistingIdCollisionService;
  });

  it('drops the old single-column PK on TestEventEntity rows', async () => {
    const svc = new ImportRowProcessorService(
      dup,
      registry,
      assigner,
      collision
    );
    const materialized: Record<string, unknown> = { id: 'old', name: 'x' };
    const skip = await svc.preProcessRow({
      raw: { id: 'old' },
      materialized,
      meta: makeMeta('TestEventEntity'),
      name: 'TestEventEntity',
      pkInfo: { primaryIsSingle: true, primaryKeyProp: 'id' },
      existingIds: null,
      existingCompositeEventMap: null,
      ctx: makeCtx()
    });
    expect(skip).toBe(false);
    expect(materialized.id).toBeUndefined();
    expect(assigner.assignIfApplicable).toHaveBeenCalled();
  });

  it('returns true when an existing-id collision is detected via the collision service', async () => {
    const svc = new ImportRowProcessorService(
      dup,
      registry,
      assigner,
      collision
    );
    const materialized = { id: 'k' };
    const result = await svc.preProcessRow({
      raw: { id: 'k' },
      materialized,
      meta: makeMeta('Foo'),
      name: 'Foo',
      pkInfo: { primaryIsSingle: true, primaryKeyProp: 'id' },
      existingIds: new Set(['k']),
      existingCompositeEventMap: null,
      ctx: makeCtx()
    });
    expect(result).toBe(true);
    expect(collision.handleCollision).toHaveBeenCalled();
  });

  it('falls back to default upsert handling when no collision service is provided', async () => {
    const svc = new ImportRowProcessorService(dup, registry, assigner);
    const ctx = makeCtx();
    const result = await svc.preProcessRow({
      raw: { id: 'old' },
      materialized: { id: 'k' },
      meta: makeMeta('Foo'),
      name: 'Foo',
      pkInfo: { primaryIsSingle: true, primaryKeyProp: 'id' },
      existingIds: new Set(['k']),
      existingCompositeEventMap: null,
      ctx
    });
    expect(result).toBe(true);
    expect(ctx.stats.Foo.skipped).toBe(1);
  });

  it('lets default upsert-eligible entities pass through on collision', async () => {
    const svc = new ImportRowProcessorService(dup, registry, assigner);
    const result = await svc.preProcessRow({
      raw: { id: 'old' },
      materialized: { id: 'k' },
      meta: makeMeta('SpecEntity'),
      name: 'SpecEntity',
      pkInfo: { primaryIsSingle: true, primaryKeyProp: 'id' },
      existingIds: new Set(['k']),
      existingCompositeEventMap: null,
      ctx: makeCtx()
    });
    expect(result).toBe(false);
  });

  it('returns false when no PK is set', async () => {
    const svc = new ImportRowProcessorService(
      dup,
      registry,
      assigner,
      collision
    );
    const result = await svc.preProcessRow({
      raw: {},
      materialized: {},
      meta: makeMeta('Foo'),
      name: 'Foo',
      pkInfo: { primaryIsSingle: true, primaryKeyProp: 'id' },
      existingIds: new Set(['k']),
      existingCompositeEventMap: null,
      ctx: makeCtx()
    });
    expect(result).toBe(false);
  });
});
