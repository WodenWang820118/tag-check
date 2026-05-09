import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { SpecRepositoryService } from './spec-repository.service';

function build() {
  const repository = {
    findOne: vi.fn(),
    find: vi.fn(),
    save: vi.fn(),
    update: vi.fn()
  };
  const testEventRepository = {
    findOne: vi.fn()
  };
  const service = new SpecRepositoryService(
    repository as never,
    testEventRepository as never
  );
  return { service, repository, testEventRepository };
}

describe('SpecRepositoryService', () => {
  it('get() returns the entity for the requested id', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue({ id: 1 });
    const result = await service.get(1);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toMatchObject({ id: 1 });
  });

  it('list() returns DTOs filtered by project slug', async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const result = await service.list('demo');
    expect(repository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { testEvent: { project: { projectSlug: 'demo' } } }
      })
    );
    expect(result).toHaveLength(2);
  });

  it('list() returns an empty array when no entities are found', async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([]);
    const result = await service.list('demo');
    expect(result).toEqual([]);
  });

  it('list() wraps repository errors into HttpException', async () => {
    const { service, repository } = build();
    repository.find.mockRejectedValue(new Error('db'));
    await expect(service.list('demo')).rejects.toBeInstanceOf(HttpException);
  });

  it('getSpecByProjectSlugAndEventId() filters by both projectSlug and eventId', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue({ id: 1 });
    await service.getSpecByProjectSlugAndEventId('demo', 'evt');
    expect(repository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          testEvent: {
            project: { projectSlug: 'demo' },
            eventId: 'evt'
          }
        }
      })
    );
  });

  it('getSpecByProjectSlugAndEventId() wraps repository errors as BAD_REQUEST', async () => {
    const { service, repository } = build();
    repository.findOne.mockRejectedValue(new Error('db'));
    await expect(
      service.getSpecByProjectSlugAndEventId('demo', 'evt')
    ).rejects.toMatchObject({ status: HttpStatus.BAD_REQUEST });
  });

  it('create() persists a spec bound to the test event', async () => {
    const { service, repository } = build();
    const testEvent = { id: 1 } as never;
    repository.save.mockImplementation(async (entity) => ({
      id: 2,
      ...entity
    }));
    await service.create(testEvent, {
      event: 'page_view',
      dataLayerSpec: [],
      rawGtmTag: 'tag'
    } as never);
    const saved = repository.save.mock.calls[0][0];
    expect(saved.testEvent).toBe(testEvent);
    expect(saved.eventName).toBe('page_view');
    expect(saved.rawGtmTag).toBe('tag');
  });

  it('create() wraps repository errors as BAD_REQUEST', async () => {
    const { service, repository } = build();
    repository.save.mockRejectedValue(new Error('db'));
    await expect(
      service.create(
        {} as never,
        { event: 'x', dataLayerSpec: [], rawGtmTag: '' } as never
      )
    ).rejects.toMatchObject({ status: HttpStatus.BAD_REQUEST });
  });

  it('update() resolves the test event then updates the spec by relation', async () => {
    const { service, repository, testEventRepository } = build();
    const testEvent = { id: 9, eventId: 'evt' };
    testEventRepository.findOne.mockResolvedValue(testEvent);
    repository.update.mockResolvedValue({ affected: 1 });
    await service.update('demo', 'evt', {
      event: 'click',
      dataLayerSpec: []
    } as never);
    const [criteria, payload] = repository.update.mock.calls[0];
    expect(criteria).toEqual({ testEvent });
    expect(payload.eventName).toBe('click');
  });

  it('update() throws NOT_FOUND when no test event matches', async () => {
    const { service, testEventRepository } = build();
    testEventRepository.findOne.mockResolvedValue(null);
    await expect(
      service.update('demo', 'evt', {} as never)
    ).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
  });
});
