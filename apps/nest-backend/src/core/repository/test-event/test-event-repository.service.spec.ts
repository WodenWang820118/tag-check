import { describe, expect, it, vi } from 'vitest';
import { TestEventRepositoryService } from './test-event-repository.service';

function build() {
  const repository = {
    findOne: vi.fn(),
    find: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    remove: vi.fn(),
    createQueryBuilder: vi.fn()
  };
  const service = new TestEventRepositoryService(repository as never);
  return { service, repository };
}

describe('TestEventRepositoryService', () => {
  it('listReports() returns DTOs filtered by project slug', async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const result = await service.listReports('demo');
    expect(repository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { project: { projectSlug: 'demo' } }
      })
    );
    expect(result).toHaveLength(2);
  });

  it('listFileReports() builds a query joining all relations and filters by slug', async () => {
    const { service, repository } = build();
    const qb: Record<string, unknown> = {};
    qb.leftJoinAndSelect = vi.fn().mockReturnValue(qb);
    qb.where = vi.fn().mockReturnValue(qb);
    qb.getMany = vi.fn().mockResolvedValue([{ id: 1 }]);
    repository.createQueryBuilder.mockReturnValue(qb);
    const result = await service.listFileReports('demo');
    expect(qb.where).toHaveBeenCalledWith(
      'project.projectSlug = :projectSlug',
      {
        projectSlug: 'demo'
      }
    );
    expect(result).toEqual([{ id: 1 }]);
  });

  it('getEntityByEventId() throws NOT_FOUND when no entity exists', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue(null);
    await expect(service.getEntityByEventId('evt')).rejects.toMatchObject({
      status: 404
    });
  });

  it('getEntityBySlugAndEventId() returns the entity when found', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue({ id: 1 });
    const result = await service.getEntityBySlugAndEventId('demo', 'evt');
    expect(result).toEqual({ id: 1 });
  });

  it('getEntityBySlugAndEventId() throws NOT_FOUND when missing', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue(null);
    await expect(
      service.getEntityBySlugAndEventId('demo', 'evt')
    ).rejects.toMatchObject({
      status: 404
    });
  });

  it('getBySlugAndEventIds() returns one DTO per matched entity', async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const result = await service.getBySlugAndEventIds('demo', [
      'e1',
      'e2',
      'e3'
    ]);
    expect(result).toHaveLength(3);
  });

  it('create() persists a new test event with the provided fields', async () => {
    const { service, repository } = build();
    const project = { id: 9 } as never;
    repository.save.mockImplementation(async (entity) => ({
      id: 1,
      ...entity
    }));
    await service.create(project, {
      eventId: 'evt',
      eventName: 'page_view',
      testName: 't',
      message: 'm'
    } as never);
    const saved = repository.save.mock.calls[0][0];
    expect(saved.project).toBe(project);
    expect(saved.eventId).toBe('evt');
    expect(saved.eventName).toBe('page_view');
    expect(saved.stopNavigation).toBe(false);
  });

  it('create() wraps repository errors as BAD_REQUEST', async () => {
    const { service, repository } = build();
    repository.save.mockRejectedValue(new Error('db'));
    await expect(
      service.create(
        {} as never,
        {
          eventId: 'e',
          eventName: 'n',
          testName: 't',
          message: 'm'
        } as never
      )
    ).rejects.toMatchObject({ status: 400 });
  });

  it('updateTestEvent() forwards the update payload to the repository', async () => {
    const { service, repository } = build();
    repository.update.mockResolvedValue({ affected: 1 });
    await service.updateTestEvent(7, { message: 'm' } as never);
    expect(repository.update).toHaveBeenCalledWith(7, { message: 'm' });
  });

  it('updateTestEvent() wraps update failures as BAD_REQUEST', async () => {
    const { service, repository } = build();
    repository.update.mockRejectedValue(new Error('db'));
    await expect(
      service.updateTestEvent(7, { message: 'm' } as never)
    ).rejects.toMatchObject({ status: 400 });
  });

  it('updateTestEvents() saves only events whose ids are present in the dto and re-fetches with relations', async () => {
    const { service, repository } = build();
    const events = [
      { id: 1, eventId: 'a' },
      { id: 2, eventId: 'b' },
      { id: 3, eventId: 'c' }
    ];
    repository.find
      .mockResolvedValueOnce(events) // first find: load existing
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }]); // re-fetch
    repository.save.mockImplementation(async (entity) => entity);
    await service.updateTestEvents('demo', [
      { eventId: 'a', message: 'A' },
      { eventId: 'b', message: 'B' }
    ] as never);
    expect(repository.save).toHaveBeenCalledTimes(2);
  });

  it('update() forwards update payload', async () => {
    const { service, repository } = build();
    repository.update.mockResolvedValue({ affected: 1 });
    await service.update(1, { message: 'm' } as never);
    expect(repository.update).toHaveBeenCalledWith(1, { message: 'm' });
  });

  it('deleteByProjectSlugAndEventId() deletes by composite criteria', async () => {
    const { service, repository } = build();
    repository.delete.mockResolvedValue({ affected: 1 });
    await service.deleteByProjectSlugAndEventId('demo', 'evt');
    expect(repository.delete).toHaveBeenCalledWith({
      project: { projectSlug: 'demo' },
      eventId: 'evt'
    });
  });

  it('deleteByProjectSlugAndEventIds() rejects empty event id arrays', async () => {
    const { service } = build();
    await expect(
      service.deleteByProjectSlugAndEventIds('demo', [])
    ).rejects.toMatchObject({ status: 400 });
  });

  it('deleteByProjectSlugAndEventIds() rejects non-string entries', async () => {
    const { service } = build();
    await expect(
      service.deleteByProjectSlugAndEventIds('demo', [1 as never])
    ).rejects.toMatchObject({ status: 400 });
  });

  it('deleteByProjectSlugAndEventIds() removes matched entities via the query builder', async () => {
    const { service, repository } = build();
    const qb: Record<string, unknown> = {};
    qb.leftJoinAndSelect = vi.fn().mockReturnValue(qb);
    qb.where = vi.fn().mockReturnValue(qb);
    qb.andWhere = vi.fn().mockReturnValue(qb);
    qb.getMany = vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]);
    repository.createQueryBuilder.mockReturnValue(qb);
    repository.remove.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    await service.deleteByProjectSlugAndEventIds('demo', ['a', 'b']);
    expect(repository.remove).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
  });
});
