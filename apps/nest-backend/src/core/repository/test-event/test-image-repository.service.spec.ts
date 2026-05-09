import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { TestImageRepositoryService } from './test-image-repository.service';

function build() {
  const repository = {
    findOne: vi.fn(),
    find: vi.fn(),
    save: vi.fn()
  };
  const testEventRepository = { findOne: vi.fn() };
  const service = new TestImageRepositoryService(
    repository as never,
    testEventRepository as never
  );
  return { service, repository, testEventRepository };
}

describe('TestImageRepositoryService', () => {
  it('get() returns a DTO for the requested id', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue({ id: 1, imageName: 'a.png' });
    const result = await service.get(1);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toMatchObject({ id: 1 });
  });

  it('getBySlugAndEventId() filters by both slug and eventId', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue({ id: 1 });
    await service.getBySlugAndEventId('demo', 'evt');
    expect(repository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          testEvent: { eventId: 'evt', project: { projectSlug: 'demo' } }
        }
      })
    );
  });

  it('getBySlugAndEventIds() returns DTOs for all matching events', async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const result = await service.getBySlugAndEventIds('demo', ['e1', 'e2']);
    expect(result).toHaveLength(2);
  });

  it('create() persists an image with derived size when not provided', async () => {
    const { service, repository, testEventRepository } = build();
    const testEvent = { id: 9 };
    testEventRepository.findOne.mockResolvedValue(testEvent);
    repository.save.mockImplementation(async (entity) => ({
      id: 11,
      ...entity
    }));
    const data = {
      imageName: 'a.png',
      imageData: new Uint8Array([1, 2, 3, 4])
    } as never;
    await service.create('demo', 'evt', data);
    const saved = repository.save.mock.calls[0][0];
    expect(saved.imageName).toBe('a.png');
    expect(saved.imageSize).toBe(4);
    expect(Buffer.isBuffer(saved.imageData)).toBe(true);
    expect(saved.testEvent).toBe(testEvent);
  });

  it('create() honors an explicitly provided imageSize', async () => {
    const { service, repository, testEventRepository } = build();
    testEventRepository.findOne.mockResolvedValue({ id: 9 });
    repository.save.mockResolvedValue({ id: 1 });
    await service.create('demo', 'evt', {
      imageName: 'a.png',
      imageData: new Uint8Array([1, 2]),
      imageSize: 999
    } as never);
    expect(repository.save.mock.calls[0][0].imageSize).toBe(999);
  });

  it('create() throws NOT_FOUND when no test event is found', async () => {
    const { service, testEventRepository } = build();
    testEventRepository.findOne.mockResolvedValue(null);
    await expect(
      service.create('demo', 'evt', {
        imageName: 'a',
        imageData: new Uint8Array([1])
      } as never)
    ).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
  });

  it('create() throws when imageData is missing', async () => {
    const { service, testEventRepository } = build();
    testEventRepository.findOne.mockResolvedValue({ id: 1 });
    await expect(
      service.create('demo', 'evt', { imageName: 'a' } as never)
    ).rejects.toThrow('No data provided');
  });

  it('create() throws when imageName is missing', async () => {
    const { service, testEventRepository } = build();
    testEventRepository.findOne.mockResolvedValue({ id: 1 });
    await expect(
      service.create('demo', 'evt', { imageData: new Uint8Array([1]) } as never)
    ).rejects.toThrow('No name provided');
  });

  it('update() saves the dto and returns a DTO', async () => {
    const { service, repository } = build();
    repository.save.mockResolvedValue({ id: 1, imageName: 'b' });
    const result = await service.update({ imageName: 'b' } as never);
    expect(repository.save).toHaveBeenCalledWith({ imageName: 'b' });
    expect(result).toMatchObject({ imageName: 'b' });
  });
});
