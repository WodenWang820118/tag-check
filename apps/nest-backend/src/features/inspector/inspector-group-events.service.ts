import { Injectable, Logger } from '@nestjs/common';
import { StrictDataLayerEvent } from '@utils';
import { Page, Browser, Credentials } from 'puppeteer';
import { FileService } from '../../infrastructure/os/file/file.service';
import { EventInspectionPresetDto } from '../../shared/dto/event-inspection-preset.dto';
import { FilePathService } from '../../infrastructure/os/path/file-path/file-path.service';
import { InspectorSingleEventService } from './inspector-single-event.service';
import { InspectorUtilsService } from './inspector-utils.service';

// Note: Not yet implemented
@Injectable()
export class InspectorGroupEventsService {
  private readonly logger = new Logger(InspectorGroupEventsService.name);
  constructor(
    private readonly fileService: FileService,
    private readonly filePathService: FilePathService,
    private readonly inspectorSingleEventService: InspectorSingleEventService,
    private readonly inspectorUtilsService: InspectorUtilsService
  ) {}

  async inspectProjectDataLayer(
    browser: Browser,
    projectName: string,
    measurementId: string,
    credentials: Credentials,
    captureRequest: string,
    concurrency?: number
  ) {
    // deal with invalid concurrency
    concurrency = Math.max(1, concurrency || 1);

    const operations =
      await this.fileService.getOperationJsonByProject(projectName);

    // Each entry is an inspection result, a caught `{ error }`, or a rejection reason.
    const results: unknown[] = [];
    for (let i = 0; i < operations.length; i += concurrency) {
      const incognitoContext = await browser.createBrowserContext();
      const operationBatch = operations.slice(i, i + concurrency);

      const batchPromises = operationBatch.map(async (operation) => {
        const testName = operation.replace('.json', '');
        let page: Page | undefined;
        try {
          page = await incognitoContext.newPage();
          const result =
            await this.inspectorSingleEventService.inspectDataLayer(
              page,
              projectName,
              testName,
              measurementId,
              credentials,
              captureRequest,
              // Group runs have no preset; '' stands in for "no application".
              '' as unknown as EventInspectionPresetDto['application']
            );
          await this.fileService.writeCacheFile(projectName, operation, result);
          const imageSavingFolder = await this.filePathService.getImageFilePath(
            projectName,
            testName
          );

          await page.screenshot({
            fullPage: true,
            path: `${imageSavingFolder}.png`
          });

          return result;
        } catch (error) {
          this.logger.log(error);
          await this.fileService.writeCacheFile(projectName, operation, error);
          return { error: error };
        } finally {
          await page
            ?.close()
            .catch((error) =>
              this.logger.error(`Error closing inspection page: ${error}`)
            );
        }
      });
      // Wait for the batch to complete
      const batchResults = await Promise.allSettled(batchPromises);
      // Extract results or errors
      for (const result of batchResults) {
        results.push(
          result.status === 'fulfilled' ? result.value : result.reason
        );
      }

      // Dispose of the incognito context after each batch
      await incognitoContext.close();
    }

    return results;
  }

  // return true if the dataLayer is correct
  // return missing keys if the dataLayer is partially correct
  // return false if the dataLayer object hasn't been found
  isDataLayerCorrect(
    dataLayer: StrictDataLayerEvent[],
    spec: StrictDataLayerEvent
  ) {
    return this.inspectorUtilsService.isDataLayerCorrect(dataLayer, spec);
  }
}
