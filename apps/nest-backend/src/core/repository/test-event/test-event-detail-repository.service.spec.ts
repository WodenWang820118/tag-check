import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { TestEventDetailRepositoryService } from './test-event-detail-repository.service';

function build() {
  const repository = {
    findOne: vi.fn(),
    find: vi.fn(),
    save: vi.fn(),
    update: vi.fn()
  };
  const testEventRepository = { findOne: vi.fn() };
  const service = new TestEventDetailRepositoryService(
    repository as never,
    testEventRepository as never
  );
  return { service, repository, testEventRepository };
}

describe('TestEventDetailRepositoryService', () => {
  it('getBySlugAndEventId() filters by slug, eventId and orders by createdAt DESC', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue({ id: 1 });
    await service.getBySlugAndEventId('demo', 'evt');
    expect(repository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          testEvent: { project: { projectSlug: 'demo' }, eventId: 'evt' }
        },
        order: { createdAt: 'DESC' }
      })
    );
  });

  it('getBySlugAndEventIds() returns DTOs for matching events', async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const result = await service.getBySlugAndEventIds('demo', ['e1', 'e2']);
    expect(result).toHaveLength(2);
  });

  it('create() persists a detail bound to the test event', async () => {
    const { service, repository } = build();
    const testEvent = { id: 9 } as never;
    repository.save.mockImplementation(async (entity) => ({
      id: 11,
      ...entity
    }));
    await service.create(testEvent, {
      dataLayer: [{ event: 'x' }],
      destinationUrl: 'https://example.com',
      passed: true,
      requestPassed: true,
      rawRequest: 'raw'
    } as never);
    const saved = repository.save.mock.calls[0][0];
    expect(saved.testEvent).toBe(testEvent);
    expect(saved.passed).toBe(true);
    expect(saved.destinationUrl).toBe('https://example.com');
  });

  it('create() wraps errors as BAD_REQUEST', async () => {
    const { service, repository } = build();
    repository.save.mockRejectedValue(new Error('db'));
    await expect(
      service.create(
        {} as never,
        {
          dataLayer: [],
          destinationUrl: '',
          passed: false,
          requestPassed: false,
          rawRequest: ''
        } as never
      )
    ).rejects.toMatchObject({ status: HttpStatus.BAD_REQUEST });
  });

  it('update() resolves the test event then updates by relation, applying defaults', async () => {
    const { service, repository, testEventRepository } = build();
    const testEvent = { id: 1, eventId: 'evt' };
    testEventRepository.findOne.mockResolvedValue(testEvent);
    repository.update.mockResolvedValue({ affected: 1 });
    await service.update('demo', 'evt', {} as never);
    const [criteria, payload] = repository.update.mock.calls[0];
    expect(criteria).toEqual({ testEvent });
    expect(payload.passed).toBe(false);
    expect(payload.requestPassed).toBe(false);
    expect(payload.rawRequest).toBe('');
    expect(payload.destinationUrl).toBe('');
    expect(payload.dataLayer).toEqual([]);
  });

  it('update() rethrows when the test event is missing as a wrapped HttpException', async () => {
    const { service, testEventRepository } = build();
    testEventRepository.findOne.mockResolvedValue(null);
    await expect(
      service.update('demo', 'evt', {} as never)
    ).rejects.toBeInstanceOf(HttpException);
  });
});
