import { HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { RUN_SUMMARY_SAMPLE, shapeOf } from '@utils';
import { TestEventDetailRepositoryService } from './test-event-detail-repository.service';

function build() {
  const repository = {
    findOne: vi.fn(),
    find: vi.fn(),
    save: vi.fn()
  };
  const service = new TestEventDetailRepositoryService(repository as never);
  return { service, repository };
}

describe('TestEventDetailRepositoryService', () => {
  it('listRunSummaries() selects only the listed columns, newest first', async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([]);

    await service.listRunSummaries('demo');

    expect(repository.find).toHaveBeenCalledWith({
      select: {
        id: true,
        passed: true,
        requestPassed: true,
        requestChecked: true,
        createdAt: true,
        testEvent: { id: true, eventId: true, eventName: true, testName: true }
      },
      relations: { testEvent: true },
      where: { testEvent: { project: { projectSlug: 'demo' } } },
      order: { createdAt: 'DESC', id: 'DESC' }
    });
  });

  it('listRunSummaries() returns the RunSummary contract over JSON', async () => {
    const { service, repository } = build();
    repository.find.mockResolvedValue([
      {
        id: RUN_SUMMARY_SAMPLE.runId,
        passed: RUN_SUMMARY_SAMPLE.passed,
        requestPassed: RUN_SUMMARY_SAMPLE.requestPassed,
        requestChecked: RUN_SUMMARY_SAMPLE.requestChecked,
        createdAt: new Date(RUN_SUMMARY_SAMPLE.runAt),
        testEvent: {
          id: 3,
          eventId: RUN_SUMMARY_SAMPLE.eventId,
          eventName: RUN_SUMMARY_SAMPLE.eventName,
          testName: RUN_SUMMARY_SAMPLE.testName
        }
      }
    ]);

    const [run] = JSON.parse(
      JSON.stringify(await service.listRunSummaries('demo'))
    );

    expect(run).toEqual(RUN_SUMMARY_SAMPLE);
    expect(shapeOf(run)).toEqual(shapeOf(RUN_SUMMARY_SAMPLE));
  });

  it('getBySlugAndEventId() filters by slug, eventId and orders by createdAt DESC', async () => {
    const { service, repository } = build();
    repository.findOne.mockResolvedValue({ id: 1 });
    await service.getBySlugAndEventId('demo', 'evt');
    expect(repository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          testEvent: { project: { projectSlug: 'demo' }, eventId: 'evt' }
        },
        order: { createdAt: 'DESC', id: 'DESC' }
      })
    );
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
});
