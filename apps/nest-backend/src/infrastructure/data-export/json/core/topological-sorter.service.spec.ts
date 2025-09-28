import { TopologicalSorterService } from './topological-sorter.service';
import { EntityMetadata } from 'typeorm';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FixtureEnvelopeV1, FixtureRow } from '../../interfaces/fixture-types';

// Minimal shape for FixtureEnvelopeV1 used by the service
interface TestFixtureEnvelopeV1 extends FixtureEnvelopeV1 {
  version: 1;
  exportedAt: string;
  schemaHash: string;
  projectSlug: string;
  entities: Record<string, FixtureRow[]>;
}

interface RelationStub {
  inverseEntityMetadata: { name: string } | null;
  relationType: string;
  isManyToOne?: boolean;
  isOneToOneOwner?: boolean;
  isOwning?: boolean;
  joinColumns?: unknown[];
}

// Helper to make a stub EntityMetadata with given name and relations
function makeMeta(
  name: string,
  relations: RelationStub[] = []
): EntityMetadata {
  // The service only iterates and reads a subset of fields, so we provide an object matching that surface.
  return {
    name,
    relations: relations as unknown as object[]
  } as EntityMetadata;
}

function relation(
  partial: Partial<RelationStub> & { parentName?: string }
): RelationStub {
  return {
    inverseEntityMetadata: partial.parentName
      ? { name: partial.parentName }
      : null,
    relationType: partial.relationType || 'many-to-one',
    isManyToOne: partial.isManyToOne ?? partial.relationType === 'many-to-one',
    isOneToOneOwner: partial.isOneToOneOwner ?? false,
    isOwning: partial.isOwning ?? false,
    joinColumns: partial.joinColumns ?? []
  };
}

describe('TopologicalSorterService', () => {
  let service: TopologicalSorterService;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    service = new TopologicalSorterService();
    // Provide a noop implementation (return void) for warn

    warnSpy = vi
      .spyOn(service['logger'] as any, 'warn')
      .mockImplementation(() => {
        /* noop */
      });
  });

  function run(envEntities: string[], metas: Record<string, EntityMetadata>) {
    const env: TestFixtureEnvelopeV1 = {
      version: 1,
      exportedAt: new Date().toISOString(),
      schemaHash: 'test',
      projectSlug: 'proj',
      entities: Object.fromEntries(envEntities.map((e) => [e, []]))
    };
    return service.order(env, new Map(Object.entries(metas)));
  }

  it('returns alphabetical order when there are no relations', () => {
    const metas = {
      B: makeMeta('B'),
      A: makeMeta('A'),
      C: makeMeta('C')
    };
    const result = run(['B', 'A', 'C'], metas);
    expect(result).toEqual(['A', 'B', 'C']);
  });

  it('orders simple parent -> child chain', () => {
    // A parent of B, B parent of C
    const metas = {
      A: makeMeta('A', [
        relation({ parentName: 'Root', relationType: 'many-to-one' })
      ]), // extraneous, parent not in env, ignored
      B: makeMeta('B', [
        relation({
          parentName: 'A',
          relationType: 'many-to-one',
          isManyToOne: true
        })
      ]),
      C: makeMeta('C', [
        relation({
          parentName: 'B',
          relationType: 'many-to-one',
          isManyToOne: true
        })
      ])
    };
    const result = run(['A', 'B', 'C'], metas);
    expect(result).toEqual(['A', 'B', 'C']);
  });

  it('orders branching parent before its children with deterministic sort', () => {
    const metas = {
      Parent: makeMeta('Parent'),
      Child2: makeMeta('Child2', [
        relation({
          parentName: 'Parent',
          relationType: 'many-to-one',
          isManyToOne: true
        })
      ]),
      Child1: makeMeta('Child1', [
        relation({
          parentName: 'Parent',
          relationType: 'many-to-one',
          isManyToOne: true
        })
      ])
    };
    const result = run(['Parent', 'Child2', 'Child1'], metas);
    expect(result.slice(0, 1)).toEqual(['Parent']);
    // Children should appear sorted alphabetically after parent
    expect(result).toEqual(['Parent', 'Child1', 'Child2']);
  });

  it('detects cycle and still includes all nodes', () => {
    const metas = {
      A: makeMeta('A', [
        relation({
          parentName: 'B',
          relationType: 'many-to-one',
          isManyToOne: true
        })
      ]),
      B: makeMeta('B', [
        relation({
          parentName: 'A',
          relationType: 'many-to-one',
          isManyToOne: true
        })
      ])
    };
    const result = run(['A', 'B'], metas);
    expect(new Set(result)).toEqual(new Set(['A', 'B']));
    expect(warnSpy).toHaveBeenCalledWith(
      'Cycle detected in entity dependency graph. Falling back to partial ordering.'
    );
  });

  it('applies heuristic to move TestEventEntity immediately after ProjectEntity', () => {
    const metas = {
      ProjectEntity: makeMeta('ProjectEntity'),
      TestEventEntity: makeMeta('TestEventEntity', [
        relation({
          parentName: 'ProjectEntity',
          relationType: 'many-to-one',
          isManyToOne: true
        })
      ]),
      AnotherEntity: makeMeta('AnotherEntity')
    };
    const result = run(
      ['TestEventEntity', 'AnotherEntity', 'ProjectEntity'],
      metas
    );
    const projIdx = result.indexOf('ProjectEntity');
    const testIdx = result.indexOf('TestEventEntity');
    expect(testIdx).toBe(projIdx + 1);
  });

  it('ignores self-referential relation for indegree increment', () => {
    const metas = {
      A: makeMeta('A', [
        relation({
          parentName: 'A',
          relationType: 'many-to-one',
          isManyToOne: true
        })
      ])
    };
    const result = run(['A'], metas);
    expect(result).toEqual(['A']);
  });
});
