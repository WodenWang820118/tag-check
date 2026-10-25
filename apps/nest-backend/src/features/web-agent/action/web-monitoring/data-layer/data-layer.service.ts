import { Injectable, Logger } from '@nestjs/common';
import { join } from 'path';
import { Page } from 'puppeteer';
import { FolderPathService } from '../../../../../infrastructure/os/path/folder-path/folder-path.service';
import { extractEventNameFromId } from '@utils';
import { FileService } from '../../../../../infrastructure/os/file/file.service';
import { FilePathService } from '../../../../../infrastructure/os/path/file-path/file-path.service';

/**
 * Copies `window.dataLayer` out of the page one push at a time. Cloning the
 * whole array fails as soon as one push holds something a page cannot hand
 * over: GTM preview mode pushes functions, and auto-events carry DOM nodes in
 * `gtm.element`. Such pushes keep their other values. Source text, because
 * the ES5 bundle would add swc helpers to a function that the page lacks.
 */
export const DATA_LAYER_SNAPSHOT_SCRIPT = `(function () {
  var source = globalThis.dataLayer;
  if (!Array.isArray(source)) return [{ event: 'no data layer' }];
  var copy = [];
  for (var i = 0; i < source.length; i++) {
    try {
      copy.push(structuredClone(source[i]));
    } catch (cloneError) {
      try {
        var json = JSON.stringify(source[i], function (key, value) {
          return value && value.nodeType ? undefined : value;
        });
        if (json !== undefined) copy.push(JSON.parse(json));
      } catch (jsonError) {}
    }
  }
  return copy;
})()`;

/**
 * Keeps the dataLayer a run captured in `<eventName> - myDataLayer.json` in
 * the event's report folder. Snapshots taken during the replay are merged
 * into the file, so a push survives the page navigating away.
 */
@Injectable()
export class DataLayerService {
  private readonly logger = new Logger(DataLayerService.name);
  constructor(
    private readonly folderPathService: FolderPathService,
    private readonly fileService: FileService,
    private readonly filePathService: FilePathService
  ) {}

  /** Starts the run's captured dataLayer empty. */
  async initSelfDataLayer(projectName: string, eventId: string) {
    const resultFolder =
      await this.folderPathService.getReportSavingFolderPath(projectName);
    const eventName = extractEventNameFromId(eventId);
    const filePath = join(
      resultFolder,
      eventId,
      `${eventName} - myDataLayer.json`
    );
    this.fileService.writeJsonFile(filePath, []);
  }

  /**
   * Waits up to 5 s for the page to have a non-empty dataLayer, then merges
   * a snapshot of it into the file. Never throws: a page without a dataLayer
   * is logged and skipped.
   */
  async updateSelfDataLayer(page: Page, projectName: string, eventId: string) {
    try {
      // Helper-free on purpose: swc compiles this function to ES5 for the
      // page, which has none of the bundle's helpers (see AGENTS.md).
      await page.waitForFunction(
        () => {
          const g = globalThis as unknown as { dataLayer?: unknown[] };
          return (
            Object.hasOwn(g, 'dataLayer') &&
            Array.isArray(g.dataLayer) &&
            (g.dataLayer?.length ?? 0) > 0
          );
        },
        { timeout: 5000 }
      );

      const dataLayer = (await page.evaluate(
        DATA_LAYER_SNAPSHOT_SCRIPT
      )) as unknown[];
      await this.updateSelfDataLayerAlgorithm(dataLayer, projectName, eventId);
    } catch (error) {
      this.logger.error(`Failed to update self data layer: ${error}`);
    }
  }

  /**
   * Merges `dataLayer` into the file: a push replaces the stored push with
   * the same `event` value, a push without an `event` replaces an identical
   * stored push, and any other push is appended.
   *
   * Pushes without an `event` are told apart by their content. Counted as
   * one push, the next page's gtag pushes (`gtag('consent', 'default', ...)`
   * pushes an `arguments` object) overwrote an earlier `{ ecommerce: null }`,
   * and the ecommerce event before it failed the reset check.
   */
  async updateSelfDataLayerAlgorithm(
    dataLayer: unknown[],
    projectName: string,
    eventId: string
  ) {
    if (!dataLayer || dataLayer.length === 0) return;
    const resultFolder =
      await this.folderPathService.getReportSavingFolderPath(projectName);
    const eventName = extractEventNameFromId(eventId);
    const myDataLayerFile = join(
      resultFolder,
      eventId,
      `${eventName} - myDataLayer.json`
    );

    // Ensure to read the file content before trying to parse it as JSON
    const myDataLayer: unknown[] =
      this.fileService.readJsonFile<unknown[]>(myDataLayerFile) || [];

    for (const dataLayerObject of dataLayer) {
      const existingIndex = myDataLayer.findIndex((myDataLayerObject) =>
        isSamePush(myDataLayerObject, dataLayerObject)
      );

      if (existingIndex === -1) {
        myDataLayer.push(dataLayerObject);
      } else {
        myDataLayer[existingIndex] = dataLayerObject;
      }
    }

    this.fileService.writeJsonFile(myDataLayerFile, myDataLayer);
  }

  /** Returns the run's captured dataLayer, or [] when there is none. */
  async getMyDataLayer(projectSlug: string, eventId: string) {
    const myDataLayerFile = await this.filePathService.getMyDataLayerFilePath(
      projectSlug,
      eventId
    );

    const myDataLayer =
      this.fileService.readJsonFile<unknown[]>(myDataLayerFile) || [];
    return myDataLayer;
  }
}

function eventOf(push: unknown): unknown {
  return typeof push === 'object' && push !== null
    ? (push as Record<string, unknown>)['event']
    : undefined;
}

/**
 * Whether `stored` and `pushed` are the same push for the merge: the same
 * `event` value, or, for pushes without one, the same content.
 */
function isSamePush(stored: unknown, pushed: unknown): boolean {
  const storedEvent = eventOf(stored);
  const pushedEvent = eventOf(pushed);
  if (storedEvent !== undefined || pushedEvent !== undefined) {
    return storedEvent === pushedEvent;
  }
  try {
    return JSON.stringify(stored) === JSON.stringify(pushed);
  } catch {
    // A push JSON cannot hold (a cycle, a BigInt) is kept apart.
    return false;
  }
}
