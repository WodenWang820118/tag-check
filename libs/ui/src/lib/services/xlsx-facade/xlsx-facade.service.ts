import { Injectable } from '@angular/core';
import { XlsxProcessService } from '../xlsx-process/xlsx-process.service';
import { Observable } from 'rxjs/internal/Observable';
import { take, filter, tap, catchError, EMPTY } from 'rxjs';
import { ErrorDialogComponent } from '../../components/error-dialog/error-dialog.component';
import { WebWorkerService } from '../web-worker/web-worker.service';
import { Dialog } from '@angular/cdk/dialog';

@Injectable({
  providedIn: 'root',
})
export class XlsxProcessFacade {
  // Expose the necessary observables directly
  workbook$ = this.xlsxProcessService.workbook$;
  worksheetNames$ = this.xlsxProcessService.worksheetNames$;
  fileName$ = this.xlsxProcessService.fileName$;
  dataSource$ = this.xlsxProcessService.dataSource$;
  displayedDataSource$ = this.xlsxProcessService.displayedDataSource$;
  displayedColumns$ = this.xlsxProcessService.displayedColumns$;
  displayedFailedEvents$ = this.xlsxProcessService.getDisplayedFailedEvents();
  isRenderingJson$ = this.xlsxProcessService.getIsRenderingJson();
  isPreviewing$ = this.xlsxProcessService.getIsPreviewing();

  constructor(
    private xlsxProcessService: XlsxProcessService,
    private webWorkerService: WebWorkerService,
    private dialog: Dialog
  ) {}

  onCloseOverlay(): void {
    this.xlsxProcessService.setIsPreviewing(true);
    this.xlsxProcessService.setIsRenderingJson(false);
    this.xlsxProcessService.resetAllData();
  }

  onPreviewData(): void {
    this.xlsxProcessService.setIsPreviewing(false);
    this.xlsxProcessService.setIsRenderingJson(true);
  }

  // Public API to load an XLSX file
  async loadXlsxFile(file: File) {
    await this.xlsxProcessService.loadXlsxFile(file);
  }

  // Public API to get total events
  getNumTotalEvents(): Observable<number> {
    return this.xlsxProcessService.getNumTotalEvents();
  }

  getNumParsedEvents(): Observable<number> {
    return this.xlsxProcessService.getNumParsedEvents();
  }

  setIsRenderingJson(isRenderingJson: boolean): void {
    this.xlsxProcessService.setIsRenderingJson(isRenderingJson);
  }

  getIsRenderingJson(): Observable<boolean> {
    return this.xlsxProcessService.getIsRenderingJson();
  }

  setIsPreviewing(isPreviewing: boolean): void {
    this.xlsxProcessService.setIsPreviewing(isPreviewing);
  }

  getIsPreviewing(): Observable<boolean> {
    return this.xlsxProcessService.getIsPreviewing();
  }

  resetAllData(): void {
    this.xlsxProcessService.resetAllData();
  }

  withDataHandling(source: Observable<any>, action: string, name: string) {
    return this.commonPipeHandler(source, action, name).subscribe();
  }

  withWorkbookHandling(source: Observable<any>, action: string, name: string) {
    this.xlsxProcessService.setIsPreviewing(true);
    this.xlsxProcessService.setIsRenderingJson(false);
    return this.commonPipeHandler(source, action, name).subscribe();
  }

  commonPipeHandler(observable: Observable<any>, action: string, name: string) {
    return observable.pipe(
      take(1),
      filter((data) => !!data),
      tap((data) => this.postDataToWorker(action, data, name)),
      catchError(() => {
        this.handlePostError(name);
        return EMPTY;
      })
    );
  }

  postDataToWorker(action: string, data: any, name: string) {
    this.webWorkerService.postMessage('message', {
      action,
      data,
      name,
    });
  }

  private handlePostError(titleName: string) {
    this.dialog.open(ErrorDialogComponent, {
      data: {
        message: `Failed to extract specs from the title: ${titleName}`,
      },
    });
  }

  retrieveSpecsFromSource(dataColoumnName: string) {
    this.withDataHandling(this.dataSource$, 'extractSpecs', dataColoumnName);
  }

  previewData(dataColumnName: string) {
    this.withDataHandling(
      this.displayedDataSource$,
      'previewData',
      dataColumnName
    );
  }

  switchToSelectedSheet(name: string) {
    this.withWorkbookHandling(this.workbook$, 'switchSheet', name);
  }

  onAction(action: string, dataColumnName: string) {
    switch (action) {
      case 'close': {
        this.onCloseOverlay();
        break;
      }
      case 'save': {
        this.retrieveSpecsFromSource(dataColumnName);
        this.onCloseOverlay();
        break;
      }

      case 'preview': {
        this.previewData(dataColumnName);
        this.onPreviewData();
        break;
      }

      default: {
        break;
      }
    }
  }
}
