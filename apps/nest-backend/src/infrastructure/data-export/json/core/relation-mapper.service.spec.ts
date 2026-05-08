import { describe, it, expect } from 'vitest';
import { RelationMapperService } from './relation-mapper.service';

describe('RelationMapperService', () => {
  it('register/lookup keeps an alt-key → pk map per entity', () => {
    const svc = new RelationMapperService();
    svc.register('Project', 'slug-a', 1);
    expect(svc.lookup('Project', 'slug-a')).toBe(1);
    expect(svc.lookup('Project', 'missing')).toBeUndefined();
    expect(svc.lookup('Other', 'slug-a')).toBeUndefined();
  });

  it('register ignores null altKey or pk', () => {
    const svc = new RelationMapperService();
    svc.register('Project', null, 1);
    svc.register('Project', 'slug', null);
    expect(svc.lookup('Project', null)).toBeUndefined();
  });

  it('ensure returns the same internal map for an entity', () => {
    const svc = new RelationMapperService();
    const m1 = svc.ensure('Foo');
    const m2 = svc.ensure('Foo');
    expect(m1).toBe(m2);
  });

  it('mapRelations resolves project foreign key from an idMap (numeric)', () => {
    const svc = new RelationMapperService();
    const meta = {
      relations: [
        {
          isManyToOne: true,
          propertyName: 'project',
          joinColumns: [
            { databaseName: 'projectId', propertyName: 'projectId' }
          ],
          inverseEntityMetadata: { name: 'ProjectEntity' }
        }
      ]
    } as never;
    const materialized: Record<string, unknown> = { projectId: 5 };
    svc.mapRelations(materialized, meta, undefined, {
      ProjectEntity: new Map([[5, 99]])
    });
    expect(materialized.project).toEqual({ id: 99 });
  });

  it('mapRelations falls back to the default project relation when no fk is present', () => {
    const svc = new RelationMapperService();
    const meta = {
      relations: [
        {
          isManyToOne: true,
          propertyName: 'project',
          joinColumns: [{ databaseName: 'projectId' }],
          inverseEntityMetadata: { name: 'ProjectEntity' }
        }
      ]
    } as never;
    const materialized: Record<string, unknown> = {};
    svc.mapRelations(materialized, meta, 'P-NEW');
    expect(materialized.project).toEqual({ id: 'P-NEW' });
  });

  it('mapRelations resolves an alt-key string fk via the registered map', () => {
    const svc = new RelationMapperService();
    svc.register('ProjectEntity', 'slug-a', 'P-1');
    const meta = {
      relations: [
        {
          isManyToOne: true,
          propertyName: 'project',
          joinColumns: [{ databaseName: 'projectId' }],
          inverseEntityMetadata: { name: 'ProjectEntity' }
        }
      ]
    } as never;
    const materialized: Record<string, unknown> = { projectId: 'slug-a' };
    svc.mapRelations(materialized, meta, undefined);
    expect(materialized.project).toEqual({ id: 'P-1' });
  });

  it('remaps generic *Id properties to new ids', () => {
    const svc = new RelationMapperService();
    const materialized: Record<string, unknown> = { itemDefId: 10 };
    svc.mapRelations(materialized, { relations: [] } as never, undefined, {
      ItemDefEntity: new Map([[10, 200]])
    });
    expect(materialized.itemDefId).toBe(200);
  });

  it('resolves embedded __exportRef on nested object property', () => {
    const svc = new RelationMapperService();
    svc.register('SpecEntity', 'ref-99', 7);
    const materialized: Record<string, unknown> = {
      spec: { __exportRef: 'ref-99' }
    };
    svc.mapRelations(materialized, { relations: [] } as never, undefined, {});
    expect((materialized.spec as { id?: unknown }).id).toBe(7);
    expect(materialized.specId).toBe(7);
  });
});
