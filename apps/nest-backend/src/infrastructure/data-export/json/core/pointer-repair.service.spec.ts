import { describe, it, expect, vi } from 'vitest';
import { PointerRepairService } from './pointer-repair.service';

describe('PointerRepairService', () => {
  it('repairs many-to-one pointers using id maps and saves the updated rows', async () => {
    const svc = new PointerRepairService();
    const save = vi.fn().mockResolvedValue(undefined);
    const find = vi.fn().mockResolvedValue([
      { id: 1, project_id: 'old-A' },
      { id: 2, project_id: 'old-B' },
      { id: 3, project_id: null }
    ]);
    const repo = { find, save };
    const queryRunner = {
      manager: { getRepository: () => repo }
    } as never;
    const meta = {
      name: 'Foo',
      relations: [
        {
          isManyToOne: true,
          isOneToOneOwner: false,
          joinColumns: [{ databaseName: 'project_id' }],
          propertyName: 'project',
          inverseEntityMetadata: { name: 'Project' }
        }
      ]
    } as never;
    const idMaps = {
      Project: new Map<unknown, unknown>([
        ['old-A', 'new-A'],
        ['old-B', 'new-B']
      ])
    };

    await svc.repairPointers(
      queryRunner,
      new Map([['Foo', meta]]),
      ['Foo'],
      idMaps
    );

    expect(save).toHaveBeenCalledTimes(1);
    const savedRows = save.mock.calls[0][0];
    expect(savedRows).toHaveLength(2);
    expect(savedRows[0].project).toEqual({ id: 'new-A' });
  });

  it('skips entities with no pointer columns', async () => {
    const svc = new PointerRepairService();
    const save = vi.fn();
    const find = vi.fn().mockResolvedValue([{ id: 1 }]);
    const repo = { find, save };
    const queryRunner = {
      manager: { getRepository: () => repo }
    } as never;
    const meta = { name: 'Foo', relations: [] } as never;
    await svc.repairPointers(
      queryRunner,
      new Map([['Foo', meta]]),
      ['Foo'],
      {}
    );
    expect(save).not.toHaveBeenCalled();
  });

  it('logs and continues when the bulk save throws', async () => {
    const svc = new PointerRepairService();
    const save = vi.fn().mockRejectedValue(new Error('save bad'));
    const find = vi.fn().mockResolvedValue([{ id: 1, project_id: 'old' }]);
    const repo = { find, save };
    const meta = {
      name: 'Foo',
      relations: [
        {
          isManyToOne: true,
          joinColumns: [{ databaseName: 'project_id' }],
          propertyName: 'project',
          inverseEntityMetadata: { name: 'Project' }
        }
      ]
    } as never;
    const queryRunner = { manager: { getRepository: () => repo } } as never;
    await expect(
      svc.repairPointers(queryRunner, new Map([['Foo', meta]]), ['Foo'], {
        Project: new Map([['old', 'new']])
      })
    ).resolves.toBeUndefined();
    expect(save).toHaveBeenCalled();
  });

  it('returns a falsy fetch result and skips when find throws', async () => {
    const svc = new PointerRepairService();
    const save = vi.fn();
    const find = vi.fn().mockRejectedValue(new Error('db down'));
    const repo = { find, save };
    const meta = {
      name: 'Foo',
      relations: [
        {
          isManyToOne: true,
          joinColumns: [{ databaseName: 'project_id' }],
          propertyName: 'project',
          inverseEntityMetadata: { name: 'Project' }
        }
      ]
    } as never;
    const queryRunner = { manager: { getRepository: () => repo } } as never;
    await svc.repairPointers(queryRunner, new Map([['Foo', meta]]), ['Foo'], {
      Project: new Map()
    });
    expect(save).not.toHaveBeenCalled();
  });
});
