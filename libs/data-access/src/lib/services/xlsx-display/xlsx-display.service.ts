/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { EditorService } from '../../services/editor/editor.service';
import { MatDialog } from '@angular/material/dialog';
import { DataRow, EditorTypeEnum } from '@utils';
import { XlsxHelper } from '../xlsx-facade/xlsx-helper.service';
import { ErrorDialogComponent } from '../../components/error-dialog/error-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class XlsxDisplayService {
  dataSource$ = new BehaviorSubject<any[]>([]);
  displayedDataSource$ = new BehaviorSubject<any[]>([]);
  displayedColumns$ = new BehaviorSubject<string[]>([]);
  displayedFailedEvents$ = new BehaviorSubject<any[]>([]);
  isRenderingJson$ = new BehaviorSubject<boolean>(false);
  isPreviewing$ = new BehaviorSubject<boolean>(true);

  constructor(
    private dialog: MatDialog,
    private editorService: EditorService,
    private xlsxHelper: XlsxHelper
  ) {}

  // TODO: data types
  handleReadXlsxAction(data: any): void {
    this.dataSource$.next(data.jsonData);
    this.updateDisplayData(this.xlsxHelper.filterNonEmptyData(data.jsonData));
  }

  handleSwitchSheetAction(data: any) {
    this.dataSource$.next(data.jsonData);
    this.displayedDataSource$.next(
      this.xlsxHelper.filterNonEmptyData(data.jsonData)
    );
    this.displayedColumns$.next(
      Object.keys(this.xlsxHelper.filterNonEmptyData(data.jsonData)[0])
    );
  }

  handlePreviewDataAction(data: any) {
    const events = this.processSpecs(data.jsonData);
    const failedEvents: any[] = [];
    const combinedData = events
      .map((event: any) => {
        return {
          Spec: JSON.parse(JSON.stringify(event, null, 2))
        };
      })
      .filter((event: any) => event.Spec.event !== null);

    this.xlsxHelper.unfixedableJsonString.forEach((jsonString) => {
      failedEvents.push({
        failedEvents: jsonString
      });
    });
    this.displayedFailedEvents$.next(failedEvents);
    this.displayedDataSource$.next(combinedData);
    this.displayedColumns$.next(['Spec']);

    if (this.displayedDataSource$.getValue()[0].Spec === null) {
      this.dialog.open(ErrorDialogComponent, {
        data: {
          message: `No events found in the selected colulmn. Please select another sheet and try again.`
        }
      });
    }
  }

  processSpecs(data: DataRow[]): any[] {
    const gtmSpecs = this.xlsxHelper.filterGtmSpecsFromData(data);
    const cleanedGtmSpecs = gtmSpecs.map((spec) => {
      try {
        return this.xlsxHelper.convertSpecStringToObject(spec);
      } catch (error) {
        this.dialog.open(ErrorDialogComponent, {
          data: {
            message: `Failed to parse the following spec: ${spec}; ${error}`
          }
        });
      }
    });
    return cleanedGtmSpecs.filter((spec) => spec && spec.event);
  }

  updateDisplayData(data: any) {
    this.displayedDataSource$.next(data);
    this.displayedColumns$.next(Object.keys(data[0]));
  }

  processAndSetSpecsContent(data: DataRow[]): void {
    const events = this.processSpecs(data);
    this.editorService.setContent(
      EditorTypeEnum.INPUT_JSON,
      JSON.stringify(events, null, 2)
    );
  }

  resetDisplayData() {
    this.dataSource$.next([]);
    this.displayedDataSource$.next([]);
    this.displayedColumns$.next([]);
    this.isRenderingJson$.next(false);
    this.isPreviewing$.next(true);
    this.displayedFailedEvents$.next([]);
  }

  setIsRenderingJson(isRenderingJson: boolean) {
    this.isRenderingJson$.next(isRenderingJson);
  }

  setIsPreviewing(isPreviewing: boolean) {
    this.isPreviewing$.next(isPreviewing);
  }
}
