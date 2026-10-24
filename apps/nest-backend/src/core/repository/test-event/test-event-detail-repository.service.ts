import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  CreateTestEventDetailDto,
  TestEventDetailEntity,
  TestEventDetailResponseDto,
  TestEventEntity,
  TestImageEntity
} from '../../../shared';
import { plainToInstance } from 'class-transformer';
import type { RunSummary } from '@utils';
import { screenshotsOfRuns } from './run-screenshots';

/** A test's latest run, screenshot and message after its latest run went. */
type RepointedTest = {
  latestTestEventDetailId: number | null;
  latestTestImageId: number | null;
  message: string;
};

/** What deleteRuns removed. */
export type DeletedRuns = {
  deletedRunIds: number[];
  /** Tests whose latest run was deleted: their screen recording is its. */
  latestRunDeletedEventIds: string[];
};

/** Reads, saves and deletes runs (`TestEventDetailEntity`). */
@Injectable()
export class TestEventDetailRepositoryService {
  constructor(
    @InjectRepository(TestEventDetailEntity)
    private readonly repository: Repository<TestEventDetailEntity>
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

  /**
   * The test's latest run, or an empty DTO when it has none. Runs saved in
   * the same second share `createdAt`, so the higher id breaks the tie.
   */
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
      order: { createdAt: 'DESC', id: 'DESC' }
    });
    return plainToInstance(TestEventDetailResponseDto, entity);
  }

  /**
   * Saves a run's result, with its message and, when the run saved one, its
   * screenshot.
   *
   * @throws HttpException 400 with the database error when saving fails.
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
      const tests = [
        ...new Map(
          runs.map((run) => [run.testEvent.id, run.testEvent])
        ).values()
      ];
      if (tests.length === 0) {
        return { deletedRunIds: [], latestRunDeletedEventIds: [] };
      }
      const testIds = tests.map((test) => test.id);
      // Every run and screenshot of those tests, oldest first. Screenshots
      // are read without their bytes.
      const [allRuns, allScreenshots] = await Promise.all([
        manager.find(TestEventDetailEntity, {
          select: {
            id: true,
            createdAt: true,
            message: true,
            testImage: { id: true },
            testEvent: { id: true }
          },
          relations: { testImage: true, testEvent: true },
          where: { testEvent: { id: In(testIds) } },
          order: { createdAt: 'ASC', id: 'ASC' }
        }),
        manager.find(TestImageEntity, {
          select: { id: true, createdAt: true, testEvent: { id: true } },
          relations: { testEvent: true },
          where: { testEvent: { id: In(testIds) } },
          order: { id: 'ASC' }
        })
      ]);

      const screenshotIds: number[] = [];
      const repointed: { test: TestEventEntity; values: RepointedTest }[] = [];
      for (const test of tests) {
        const testRuns = allRuns.filter((run) => run.testEvent.id === test.id);
        const screenshots = allScreenshots.filter(
          (screenshot) => screenshot.testEvent.id === test.id
        );
        const removed = new Set(
          screenshotsOfRuns(testRuns, screenshots, deleted)
        );
        screenshotIds.push(...removed);

        const latestRunId = test.latestTestEventDetailId;
        if (latestRunId != null && deleted.has(latestRunId)) {
          const remainingRuns = testRuns.filter((run) => !deleted.has(run.id));
          const remainingScreenshots = screenshots.filter(
            (screenshot) => !removed.has(screenshot.id)
          );
          const latestRun = remainingRuns.at(-1);
          repointed.push({
            test,
            values: {
              latestTestEventDetailId: latestRun?.id ?? null,
              latestTestImageId: remainingScreenshots.at(-1)?.id ?? null,
              message: latestRun?.message ?? ''
            }
          });
        }
      }

      // Point the tests away from the deleted rows before deleting them.
      await Promise.all(
        repointed.map(({ test, values }) =>
          manager.update(TestEventEntity, test.id, values)
        )
      );
      if (deleted.size > 0) {
        await manager.delete(TestEventDetailEntity, [...deleted]);
      }
      if (screenshotIds.length > 0) {
        await manager.delete(TestImageEntity, screenshotIds);
      }
      return {
        deletedRunIds: [...deleted],
        latestRunDeletedEventIds: repointed.map(({ test }) => test.eventId)
      };
    });
  }
}
