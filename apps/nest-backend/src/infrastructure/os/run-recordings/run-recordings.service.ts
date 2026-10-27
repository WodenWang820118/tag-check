import { Injectable, Logger } from '@nestjs/common';
import { existsSync } from 'fs';
import { rm } from 'fs/promises';
import { join } from 'path';
import { RUN_RECORDINGS_KEPT } from '@utils';
import { RECORDING_FILES, type RecordingFile } from '../../../shared';
import { TestEventDetailRepositoryService } from '../../../core/repository/test-event/test-event-detail-repository.service';
import { FolderPathService } from '../path/folder-path/folder-path.service';

/** The folder name of a run's recordings: a UUID chosen when it starts. */
const RECORDING_KEY =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const RUNS_FOLDER = 'runs';

/** Where a run's recordings are looked up: see RunRecordingsService.fileOf. */
export type RunRecordingRef = {
  recordingKey: string | null;
  /** Whether the run is the test's latest. */
  latest: boolean;
};

/**
 * The screen recordings of a test's runs. Each run records into a folder of
 * its own, `inspection_results/<eventId>/runs/<recordingKey>/`, and the
 * latest RUN_RECORDINGS_KEPT runs of a test keep theirs; older runs keep
 * only their screenshot. Runs saved before runs kept their own recordings
 * left the latest of them in `inspection_results/<eventId>/` itself.
 */
@Injectable()
export class RunRecordingsService {
  private readonly logger = new Logger(RunRecordingsService.name);

  constructor(
    private readonly folderPathService: FolderPathService,
    private readonly testEventDetailRepositoryService: TestEventDetailRepositoryService
  ) {}

  /**
   * The folder of a run's recordings, which may not exist yet.
   *
   * @throws Error when `recordingKey` is not a run's key.
   */
  async folderOf(
    projectSlug: string,
    eventId: string,
    recordingKey: string
  ): Promise<string> {
    if (!RECORDING_KEY.test(recordingKey)) {
      throw new Error(`Not a recording key: ${recordingKey}`);
    }
    const eventFolder =
      await this.folderPathService.getInspectionEventFolderPath(
        projectSlug,
        eventId
      );
    return join(eventFolder, RUNS_FOLDER, recordingKey);
  }

  /**
   * The path of a run's recording `file`, or null when the run kept none:
   * its own folder's file, or for the test's latest run without one, the
   * file runs saved before keeping their own left in the test's folder.
   */
  async fileOf(
    projectSlug: string,
    eventId: string,
    run: RunRecordingRef,
    file: RecordingFile
  ): Promise<string | null> {
    let path: string | null = null;
    if (run.recordingKey) {
      path = join(
        await this.folderOf(projectSlug, eventId, run.recordingKey),
        file
      );
    } else if (run.latest) {
      path = join(
        await this.folderPathService.getInspectionEventFolderPath(
          projectSlug,
          eventId
        ),
        file
      );
    }
    return path && existsSync(path) ? path : null;
  }

  /**
   * Keeps the recordings of the test's latest RUN_RECORDINGS_KEPT runs and
   * removes the older runs' folders. Never throws: a folder that cannot be
   * removed is logged and tried again after the next run.
   */
  async prune(
    projectSlug: string,
    eventId: string,
    testEventId: number
  ): Promise<void> {
    try {
      const runs =
        await this.testEventDetailRepositoryService.listRecordingKeys(
          testEventId
        );
      const expired = runs.slice(RUN_RECORDINGS_KEPT);
      const removed: number[] = [];
      for (const run of expired) {
        if (await this.removeFolder(projectSlug, eventId, run.recordingKey)) {
          removed.push(run.id);
        }
      }
      await this.testEventDetailRepositoryService.clearRecordingKeys(removed);
    } catch (error) {
      this.logger.warn(
        `Could not prune the recordings of ${eventId}: ${error}`
      );
    }
  }

  /**
   * A test's first run that keeps its own recordings removes the ones runs
   * saved before left in the test's folder, which belong to an older run.
   */
  async removeLegacy(projectSlug: string, eventId: string): Promise<void> {
    const folder = await this.folderPathService.getInspectionEventFolderPath(
      projectSlug,
      eventId
    );
    await Promise.all(
      Object.values(RECORDING_FILES).map((file) =>
        rm(join(folder, file), { force: true })
      )
    );
  }

  /** Removes the recordings of deleted runs. Never throws. */
  async removeRuns(
    projectSlug: string,
    runs: { eventId: string; recordingKey: string }[]
  ): Promise<void> {
    for (const run of runs) {
      await this.removeFolder(projectSlug, run.eventId, run.recordingKey);
    }
  }

  /**
   * Removes everything the deleted tests' runs left on disk: recordings,
   * results and caches (`inspection_results/<eventId>`). Never throws.
   */
  async removeTests(projectSlug: string, eventIds: string[]): Promise<void> {
    for (const eventId of eventIds) {
      try {
        const folder =
          await this.folderPathService.getInspectionEventFolderPath(
            projectSlug,
            eventId
          );
        await rm(folder, { recursive: true, force: true });
      } catch (error) {
        this.logger.warn(
          `Could not remove the results of ${eventId}: ${error}`
        );
      }
    }
  }

  private async removeFolder(
    projectSlug: string,
    eventId: string,
    recordingKey: string
  ): Promise<boolean> {
    try {
      await rm(await this.folderOf(projectSlug, eventId, recordingKey), {
        recursive: true,
        force: true
      });
      return true;
    } catch (error) {
      this.logger.warn(
        `Could not remove the recordings of run ${recordingKey}: ${error}`
      );
      return false;
    }
  }
}
