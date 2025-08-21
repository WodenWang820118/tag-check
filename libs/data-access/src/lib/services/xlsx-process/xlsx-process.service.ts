/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, OnDestroy } from '@angular/core';
import { Subject, takeUntil, tap } from 'rxjs';
import { WebWorkerService } from '../../services/web-worker/web-worker.service';
import { WorkbookService } from '../workbook/workbook.service';
import { XlsxDisplayService } from '../xlsx-display/xlsx-display.service';
import { FileService } from '../file/file.service';

@Injectable({
  providedIn: 'root'
})
export class XlsxProcessService implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  constructor(
    private readonly webWorkerService: WebWorkerService,
    private readonly fileService: FileService,
    public readonly workbookService: WorkbookService,
    public readonly xlsxDisplayService: XlsxDisplayService
  ) {}

  async loadXlsxFile(file: File) {
    try {
      const fileData = await this.fileService.loadFile(file);
      this.initializeDataProcessing();

      this.webWorkerService.postMessage('message', {
        action: 'readXlsx',
        data: fileData
      });
      this.workbookService.setFileName(file.name);
    } catch (error) {
      console.error(error);
    }
  }

  initializeDataProcessing() {
    // Logic from processXlsxData
    this.webWorkerService
      .onMessage()
      .pipe(
        tap((data) => {
          if (data.action === 'readXlsx') {
            this.workbookService.handleReadXlsxAction(data);
            this.xlsxDisplayService.handleReadXlsxAction(data);
          } else if (data.action === 'switchSheet') {
            this.xlsxDisplayService.handleSwitchSheetAction(data);
          } else if (data.action === 'previewData') {
            this.xlsxDisplayService.handlePreviewDataAction(data);
          } else if (data.action === 'extractSpecs') {
            this.xlsxDisplayService.processAndSetSpecsContent(data.jsonData);
          }
        }),
        takeUntil(this.destroy$) // automatically unsubscribe
      )
      .subscribe();
  }

  getNumTotalEvents() {
    return this.xlsxDisplayService.dataSource$().length;
  }

  getNumParsedEvents() {
    return this.xlsxDisplayService.displayedDataSource$().length;
  }

  get isRenderingJson() {
    return this.xlsxDisplayService.isRenderingJson$();
  }

  setIsRenderingJson(isRenderingJson: boolean) {
    this.xlsxDisplayService.setIsRenderingJson(isRenderingJson);
  }

  get isPreviewing() {
    return this.xlsxDisplayService.isPreviewing$();
  }

  setIsPreviewing(isPreviewing: boolean) {
    this.xlsxDisplayService.setIsPreviewing(isPreviewing);
  }

  get displayedFailedEvents() {
    return this.xlsxDisplayService.displayedFailedEvents$();
  }

  resetAllData() {
    this.workbookService.resetWorkbookData();
    this.xlsxDisplayService.resetDisplayData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
