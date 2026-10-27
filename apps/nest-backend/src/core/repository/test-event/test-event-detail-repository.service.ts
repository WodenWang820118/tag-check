import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Not } from 'typeorm';
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
  /**
   * Tests whose latest run was deleted. Runs saved before runs kept their
   * own recordings left theirs in the test's folder: those go with it.
   */
  latestRunDeletedEventIds: string[];
  /** The recording folders of the deleted runs that kept theirs. */
  deletedRecordings: { eventId: string; recordingKey: string }[];
};

/** A run in a test's history, with where its recordings are kept. */
export type RunHistoryRow = {
  runId: number;
  passed: boolean;
  requestPassed: boolean;
  runAt: Date;
  /** Null when the run did not keep its recordings in a folder of its own. */
  recordingKey: string | null;
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
   * The check results of the test's newest saved run (highest id), or null
   * before its first run.
   */
  async getLatestRunResult(testEventId: number): Promise<{
    id: number;
    passed: boolean;
    requestPassed: boolean;
    message: string | null;
  } | null> {
    const run = await this.repository.findOne({
      select: { id: true, passed: true, requestPassed: true, message: true },
      where: { testEvent: { id: testEventId } },
      order: { id: 'DESC' }
    });
    return run
      ? {
          id: run.id,
          passed: run.passed,
          requestPassed: run.requestPassed,
          message: run.message ?? null
        }
      : null;
  }

  /**
   * The test's run `runId`, or its latest run without one; null when there
   * is no such run. Runs saved in the same second share `createdAt`, so the
   * higher id breaks the tie.
   */
  async getBySlugAndEventId(
    projectSlug: string,
    eventId: string,
    runId?: number
  ) {
    const entity = await this.repository.findOne({
      relations: {
        testEvent: true
      },
      where: {
        ...(runId === undefined ? {} : { id: runId }),
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

  /** Every run of the test, newest first, without its results' content. */
  async listRunHistory(
    projectSlug: string,
    eventId: string
  ): Promise<RunHistoryRow[]> {
    const runs = await this.repository.find({
      select: {
        id: true,
        passed: true,
        requestPassed: true,
        createdAt: true,
        recordingKey: true
      },
      where: { testEvent: { eventId, project: { projectSlug } } },
      order: { createdAt: 'DESC', id: 'DESC' }
    });
    return runs.map((run) => ({
      runId: run.id,
      passed: run.passed,
      requestPassed: run.requestPassed,
      runAt: run.createdAt,
      recordingKey: run.recordingKey ?? null
    }));
  }

  /**
   * The screenshot run `runId` of the test saved, with its bytes when
   * `withData` is set; null when the run saved none (or is not the test's).
   */
  async getRunScreenshot(
    projectSlug: string,
    eventId: string,
    runId: number,
    withData = false
  ): Promise<TestImageEntity | null> {
    const run = await this.repository.findOne({
      select: {
        id: true,
        testImage: {
          id: true,
          imageName: true,
          imageSize: true,
          imageData: withData,
          createdAt: true,
          updatedAt: true
        }
      },
      relations: { testImage: true },
      where: { id: runId, testEvent: { eventId, project: { projectSlug } } }
    });
    return run?.testImage ?? null;
  }

  /** The test's runs that keep their recordings, newest first. */
  async listRecordingKeys(
    testEventId: number
  ): Promise<{ id: number; recordingKey: string }[]> {
    const runs = await this.repository.find({
      select: { id: true, recordingKey: true },
      where: { testEvent: { id: testEventId }, recordingKey: Not(IsNull()) },
      order: { createdAt: 'DESC', id: 'DESC' }
    });
    return runs.flatMap((run) =>
      run.recordingKey ? [{ id: run.id, recordingKey: run.recordingKey }] : []
    );
  }

  /** These runs no longer keep their recordings. */
  async clearRecordingKeys(runIds: number[]): Promise<void> {
    if (runIds.length > 0) {
      await this.repository.update({ id: In(runIds) }, { recordingKey: null });
    }
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
      testEventDetailEntity.requestMessage = data.requestMessage ?? null;
      testEventDetailEntity.recordingKey = data.recordingKey ?? null;
      testEventDetailEntity.mediaTimeline = data.mediaTimeline ?? null;
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
          recordingKey: true,
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
        return {
          deletedRunIds: [],
          latestRunDeletedEventIds: [],
          deletedRecordings: []
        };
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
        latestRunDeletedEventIds: repointed.map(({ test }) => test.eventId),
        deletedRecordings: runs.flatMap((run) =>
          run.recordingKey
            ? [
                {
                  eventId: run.testEvent.eventId,
                  recordingKey: run.recordingKey
                }
              ]
            : []
        )
      };
    });
  }
}
