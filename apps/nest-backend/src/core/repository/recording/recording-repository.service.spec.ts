import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { RecordingRepositoryService } from './recording-repository.service';

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
  const service = new RecordingRepositoryService(
    repository as never,
    testEventRepository as never
  );
  return { service, repository, testEventRepository };
}

describe('RecordingRepositoryService', () => {
  it('get() returns the entity for the requested id', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue({ id: 1, title: 't' });
    const result = await service.get(1);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toMatchObject({ id: 1 });
  });

  it('listByProject() filters recordings by the nested project slug relation', async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const result = await service.listByProject('demo');
    expect(repository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { testEvent: { project: { projectSlug: 'demo' } } }
      })
    );
    expect(result).toHaveLength(2);
  });

  it('getRecordingDetails() filters by both project slug and event id', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue({ id: 1, title: 't' });
    await service.getRecordingDetails('demo', 'evt');
    expect(repository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          testEvent: { eventId: 'evt', project: { projectSlug: 'demo' } }
        }
      })
    );
  });

  it('create() persists a recording bound to the test event', async () => {
    const { service, repository } = build();
    const testEvent = { id: 3 } as never;
    repository.save.mockImplementation(async (entity) => ({
      id: 5,
      ...entity
    }));
    await service.create(testEvent, { title: 't', steps: [] } as never);
    const saved = repository.save.mock.calls[0][0];
    expect(saved.testEvent).toBe(testEvent);
    expect(saved.title).toBe('t');
    expect(saved.steps).toEqual([]);
  });

  it('create() wraps thrown errors as BAD_REQUEST', async () => {
    const { service, repository } = build();
    repository.save.mockRejectedValue(new Error('boom'));
    await expect(
      service.create({} as never, { title: 't', steps: [] } as never)
    ).rejects.toMatchObject({ status: HttpStatus.BAD_REQUEST });
  });

  it('update() updates the recording associated with the resolved test event', async () => {
    const { service, repository, testEventRepository } = build();
    const testEvent = { id: 9, eventId: 'evt' };
    testEventRepository.findOne.mockResolvedValue(testEvent);
    repository.update.mockResolvedValue({ affected: 1 });
    await service.update('demo', 'evt', { title: 't', steps: [] } as never);
    const [criteria, payload] = repository.update.mock.calls[0];
    expect(criteria).toEqual({ testEvent });
    expect(payload.title).toBe('t');
    expect(payload.testEvent).toBe(testEvent);
  });

  it('update() throws NOT_FOUND when no test event matches', async () => {
    const { service, testEventRepository } = build();
    testEventRepository.findOne.mockResolvedValue(null);
    await expect(
      service.update('demo', 'evt', { title: 't', steps: [] } as never)
    ).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
  });
});
