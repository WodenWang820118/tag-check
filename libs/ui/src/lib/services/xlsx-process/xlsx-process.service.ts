import { Injectable, OnDestroy } from '@angular/core';
import { Subject, map, shareReplay, take, takeUntil, tap } from 'rxjs';
import { WebWorkerService } from '../../services/web-worker/web-worker.service';
import { WorkbookService } from '../workbook/workbook.service';
import { XlsxDisplayService } from '../xlsx-display/xlsx-display.service';
import { FileService } from '../file/file.service';

@Injectable({
  providedIn: 'root',
})
export class XlsxProcessService implements OnDestroy {
  workbook$ = this.workbookService.workbook$;
  worksheetNames$ = this.workbookService.worksheetNames$;
  fileName$ = this.workbookService.fileName$;
  dataSource$ = this.xlsxDisplayService.dataSource$;
  displayedDataSource$ = this.xlsxDisplayService.displayedDataSource$;
  displayedColumns$ = this.xlsxDisplayService.displayedColumns$;
  displayedFailedEvents$ = this.xlsxDisplayService.displayedFailedEvents$;
  isRenderingJson$ = this.xlsxDisplayService.isRenderingJson$;
  isPreviewing$ = this.xlsxDisplayService.isPreviewing$;
  private destroy$ = new Subject<void>();
  constructor(
    private webWorkerService: WebWorkerService,
    private workbookService: WorkbookService,
    private fileService: FileService,
    private xlsxDisplayService: XlsxDisplayService
  ) {}

  async loadXlsxFile(file: File) {
    try {
      const fileData = await this.fileService.loadFile(file);
      this.initializeDataProcessing();

      this.webWorkerService.postMessage('message', {
        action: 'readXlsx',
        data: fileData,
      });
      this.fileName$.next(file.name);
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
    return this.dataSource$.pipe(
      map((data) => {
        return data.length;
      }),
      shareReplay(1) // cache the last emitted value
    );
  }

  getNumParsedEvents() {
    return this.displayedDataSource$.pipe(
      map((data) => {
        return data.length;
      }),
      shareReplay(1) // cache the last emitted value
    );
  }

  getIsRenderingJson() {
    return this.isRenderingJson$.asObservable();
  }

  setIsRenderingJson(isRenderingJson: boolean) {
    this.xlsxDisplayService.setIsRenderingJson(isRenderingJson);
  }

  getIsPreviewing() {
    return this.isPreviewing$.asObservable();
  }

  setIsPreviewing(isPreviewing: boolean) {
    this.xlsxDisplayService.setIsPreviewing(isPreviewing);
  }

  getDisplayedFailedEvents() {
    return this.displayedFailedEvents$.asObservable();
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
