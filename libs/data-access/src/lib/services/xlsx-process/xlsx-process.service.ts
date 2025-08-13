/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, OnDestroy } from '@angular/core';
import {
  BehaviorSubject,
  Subject,
  map,
  shareReplay,
  takeUntil,
  tap
} from 'rxjs';
import { WebWorkerService } from '../../services/web-worker/web-worker.service';
import { WorkbookService } from '../workbook/workbook.service';
import { XlsxDisplayService } from '../xlsx-display/xlsx-display.service';
import { FileService } from '../file/file.service';

@Injectable({
  providedIn: 'root'
})
export class XlsxProcessService implements OnDestroy {
  workbook$: BehaviorSubject<any>;
  worksheetNames$: BehaviorSubject<string[]>;
  fileName$: BehaviorSubject<string>;
  dataSource$: BehaviorSubject<any[]>;
  displayedDataSource$: BehaviorSubject<any[]>;
  displayedColumns$: BehaviorSubject<string[]>;
  displayedFailedEvents$: BehaviorSubject<string[]>;
  isRenderingJson$: BehaviorSubject<boolean>;
  isPreviewing$: BehaviorSubject<boolean>;
  private readonly destroy$ = new Subject<void>();
  constructor(
    private readonly webWorkerService: WebWorkerService,
    private readonly workbookService: WorkbookService,
    private readonly fileService: FileService,
    private readonly xlsxDisplayService: XlsxDisplayService
  ) {
    this.workbook$ = this.workbookService.workbook$;
    this.worksheetNames$ = this.workbookService.worksheetNames$;
    this.fileName$ = this.workbookService.fileName$;
    this.dataSource$ = this.xlsxDisplayService.dataSource$;
    this.displayedDataSource$ = this.xlsxDisplayService.displayedDataSource$;
    this.displayedColumns$ = this.xlsxDisplayService.displayedColumns$;
    this.displayedFailedEvents$ =
      this.xlsxDisplayService.displayedFailedEvents$;
    this.isRenderingJson$ = this.xlsxDisplayService.isRenderingJson$;
    this.isPreviewing$ = this.xlsxDisplayService.isPreviewing$;
  }

  async loadXlsxFile(file: File) {
    try {
      const fileData = await this.fileService.loadFile(file);
      this.initializeDataProcessing();

      this.webWorkerService.postMessage('message', {
        action: 'readXlsx',
        data: fileData
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
