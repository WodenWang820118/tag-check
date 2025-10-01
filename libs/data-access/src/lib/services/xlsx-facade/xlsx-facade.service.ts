/* eslint-disable @typescript-eslint/no-explicit-any */
import { inject, Injectable } from '@angular/core';
import { XlsxProcessService } from '../xlsx-process/xlsx-process.service';
import { take, filter, tap, catchError, EMPTY, Observable } from 'rxjs';
import { WebWorkerService } from '../web-worker/web-worker.service';
import { Dialog } from '@angular/cdk/dialog';
import { ErrorDialogComponent } from '../../components/error-dialog/error-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class XlsxProcessFacade {
  // Expose the necessary observables directly
  public readonly xlsxProcessService = inject(XlsxProcessService);
  private readonly webWorkerService = inject(WebWorkerService);
  private readonly dialog = inject(Dialog);

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
  get numTotalEvents() {
    return this.xlsxProcessService.getNumTotalEvents();
  }

  get numParsedEvents() {
    return this.xlsxProcessService.getNumParsedEvents();
  }

  setIsRenderingJson(isRenderingJson: boolean): void {
    this.xlsxProcessService.setIsRenderingJson(isRenderingJson);
  }

  get isRenderingJson() {
    return this.xlsxProcessService.isRenderingJson;
  }

  setIsPreviewing(isPreviewing: boolean): void {
    this.xlsxProcessService.setIsPreviewing(isPreviewing);
  }

  get isPreviewing() {
    return this.xlsxProcessService.isPreviewing;
  }

  resetAllData(): void {
    this.xlsxProcessService.resetAllData();
  }

  withDataHandling(source: any, action: string, name: string) {
    return this.commonPipeHandler(source, action, name).subscribe();
  }

  withWorkbookHandling(source: any, action: string, name: string) {
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
      name
    });
  }

  private handlePostError(titleName: string) {
    this.dialog.open(ErrorDialogComponent, {
      data: {
        message: `Failed to extract specs from the title: ${titleName}`
      }
    });
  }

  retrieveSpecsFromSource(dataColoumnName: string) {
    this.withDataHandling(
      this.xlsxProcessService.xlsxDisplayService.dataSource$,
      'extractSpecs',
      dataColoumnName
    );
  }

  previewData(dataColumnName: string) {
    this.withDataHandling(
      this.xlsxProcessService.xlsxDisplayService.displayedDataSource$(),
      'previewData',
      dataColumnName
    );
  }

  switchToSelectedSheet(name: string) {
    // Ensure workbook$() returns an observable, not a direct value
    const workbook$ = this.xlsxProcessService.workbookService.workbook$();
    if (typeof workbook$?.pipe !== 'function') {
      throw new TypeError('workbook$ must be an observable');
    }
    this.withWorkbookHandling(workbook$, 'switchSheet', name);
  }

  onAction(action: string, dataColumnName: string | null) {
    if (!dataColumnName) {
      throw new TypeError('Data column name is required');
    }

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
