import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  CreateTestEventDetailDto,
  TestEventDetailEntity,
  TestEventDetailResponseDto,
  TestEventEntity,
  TestImageEntity,
  UpdateTestEventDetailDto
} from '../../../shared';
import { plainToInstance } from 'class-transformer';
import type { RunSummary } from '@utils';
import { screenshotsOfRuns } from './run-screenshots';

/** What deleteRuns removed. */
export type DeletedRuns = {
  deletedRunIds: number[];
  /** Tests whose latest run was deleted: their screen recording is its. */
  latestRunDeletedEventIds: string[];
};

@Injectable()
export class TestEventDetailRepositoryService {
  constructor(
    @InjectRepository(TestEventDetailEntity)
    private readonly repository: Repository<TestEventDetailEntity>,
    @InjectRepository(TestEventEntity)
    private readonly testEventRepository: Repository<TestEventEntity>
  ) {}

  /**
   * Every run of the project's tests, newest first, with only the columns the
   * Reports page shows: no raw request, data layer or screenshot.
   */
  async listRunSummaries(projectSlug: string): Promise<RunSummary[]> {
    const runs = await this.repository.find({
      select: {
        id: true,
        passed: true,
        requestPassed: true,
        createdAt: true,
        testEvent: { id: true, eventId: true, eventName: true, testName: true }
      },
      relations: { testEvent: true },
      where: { testEvent: { project: { projectSlug } } },
      order: { createdAt: 'DESC', id: 'DESC' }
    });
    return runs.map((run) => ({
      runId: run.id,
      eventId: run.testEvent.eventId,
      eventName: run.testEvent.eventName,
      testName: run.testEvent.testName,
      passed: run.passed,
      requestPassed: run.requestPassed,
      runAt: run.createdAt
    }));
  }

  async getBySlugAndEventId(projectSlug: string, eventId: string) {
    const entity = await this.repository.findOne({
      relations: {
        testEvent: true
      },
      where: {
        testEvent: {
          project: {
            projectSlug
          },
          eventId
        }
      },
      order: {
        createdAt: 'DESC'
      }
    });
    return plainToInstance(TestEventDetailResponseDto, entity);
  }

  async getBySlugAndEventIds(projectSlug: string, eventIds: string[]) {
    const entities = await this.repository.find({
      relations: {
        testEvent: true
      },
      where: {
        testEvent: {
          project: {
            projectSlug
          },
          eventId: In(eventIds)
        }
      }
    });
    return entities.map((entity) =>
      plainToInstance(TestEventDetailResponseDto, entity)
    );
  }

  /**
   * Saves a run's result, with its message and, when the run saved one, its
   * screenshot.
   */
  async create(
    testEventEntity: TestEventEntity,
    data: CreateTestEventDetailDto,
    testImage?: { id: number } | null
  ) {
    try {
      const testEventDetailEntity = new TestEventDetailEntity();

      testEventDetailEntity.dataLayer = data.dataLayer;
      testEventDetailEntity.destinationUrl = data.destinationUrl;
      testEventDetailEntity.passed = data.passed;
      testEventDetailEntity.requestPassed = data.requestPassed;
      testEventDetailEntity.rawRequest = data.rawRequest;
      testEventDetailEntity.message = data.message ?? null;
      testEventDetailEntity.testEvent = testEventEntity;
      if (testImage) {
        testEventDetailEntity.testImage = {
          id: testImage.id
        } as TestImageEntity;
      }

      const entity = await this.repository.save(testEventDetailEntity);
      return plainToInstance(TestEventDetailResponseDto, entity);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : String(error),
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Deletes the project's runs with these ids, and the screenshots they
   * saved, in one transaction. Ids of other projects' runs are ignored.
   *
   * A test whose latest run is deleted then points at its newest remaining
   * run and shows that run's message; with no run left it has none.
   */
  async deleteRuns(
    projectSlug: string,
    runIds: number[]
  ): Promise<DeletedRuns> {
    return await this.repository.manager.transaction(async (manager) => {
      const runs = await manager.find(TestEventDetailEntity, {
        select: {
          id: true,
          testEvent: { id: true, eventId: true, latestTestEventDetailId: true }
        },
        relations: { testEvent: true },
        where: { id: In(runIds), testEvent: { project: { projectSlug } } }
      });
      const deleted = new Set(runs.map((run) => run.id));
      const tests = new Map(
        runs.map((run) => [run.testEvent.id, run.testEvent])
      );
      const screenshotIds: number[] = [];
      const latestRunDeletedEventIds: string[] = [];

      for (const test of tests.values()) {
        const testRuns = await manager.find(TestEventDetailEntity, {
          select: {
            id: true,
            createdAt: true,
            message: true,
            testImage: { id: true }
          },
          relations: { testImage: true },
          where: { testEvent: { id: test.id } },
          order: { createdAt: 'ASC', id: 'ASC' }
        });
        // Metadata only: the screenshots' bytes stay on disk.
        const screenshots = await manager.find(TestImageEntity, {
          select: { id: true, createdAt: true },
          where: { testEvent: { id: test.id } },
          order: { id: 'ASC' }
        });
        const removed = screenshotsOfRuns(testRuns, screenshots, deleted);
        screenshotIds.push(...removed);

        if (
          test.latestTestEventDetailId != null &&
          deleted.has(test.latestTestEventDetailId)
        ) {
          // Point the test away from the deleted rows before deleting them.
          const latestRun = testRuns
            .filter((run) => !deleted.has(run.id))
            .at(-1);
          const latestScreenshot = screenshots
            .filter((screenshot) => !removed.includes(screenshot.id))
            .at(-1);
          await manager.update(TestEventEntity, test.id, {
            latestTestEventDetailId: latestRun?.id ?? null,
            latestTestImageId: latestScreenshot?.id ?? null,
            message: latestRun?.message ?? ''
          });
          latestRunDeletedEventIds.push(test.eventId);
        }
      }

      if (deleted.size > 0) {
        await manager.delete(TestEventDetailEntity, [...deleted]);
      }
      if (screenshotIds.length > 0) {
        await manager.delete(TestImageEntity, screenshotIds);
      }
      return { deletedRunIds: [...deleted], latestRunDeletedEventIds };
    });
  }

  async update(
    projectSlug: string,
    eventId: string,
    data: UpdateTestEventDetailDto
  ) {
    try {
      const testEvent = await this.testEventRepository.findOne({
        relations: { project: true },
        where: {
          eventId: eventId,
          project: { projectSlug: projectSlug }
        }
      });
      if (!testEvent)
        throw new HttpException('TestEvent not found', HttpStatus.NOT_FOUND);

      const newDetail = new TestEventDetailEntity();
      newDetail.passed = data.passed ?? false;
      newDetail.requestPassed = data.requestPassed ?? false;
      newDetail.rawRequest = data.rawRequest ?? '';
      newDetail.destinationUrl = data.destinationUrl ?? '';
      newDetail.dataLayer = data.dataLayer ?? [];

      const entity = await this.repository.update(
        { testEvent: testEvent },
        newDetail
      );

      return plainToInstance(TestEventDetailResponseDto, entity);
    } catch (error) {
      Logger.error(error);
      throw new HttpException(
        'Error updating test event detail',
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
