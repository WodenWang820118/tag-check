/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, Injectable, signal } from '@angular/core';
import { EditorService } from '../../services/editor/editor.service';
import { MatDialog } from '@angular/material/dialog';
import { DataRow, EditorTypeEnum } from '@utils';
import { XlsxHelper } from '../xlsx-facade/xlsx-helper.service';
import { ErrorDialogComponent } from '../../components/error-dialog/error-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class XlsxDisplayService {
  private readonly dataSource = signal<any[]>([]);
  dataSource$ = computed(() => this.dataSource());

  private readonly displayedDataSource = signal<any[]>([]);
  displayedDataSource$ = computed(() => this.displayedDataSource());

  private readonly displayedColumns = signal<string[]>([]);
  displayedColumns$ = computed(() => this.displayedColumns());

  private readonly displayedFailedEvents = signal<any[]>([]);
  displayedFailedEvents$ = computed(() => this.displayedFailedEvents());

  private readonly isRenderingJson = signal<boolean>(false);
  isRenderingJson$ = computed(() => this.isRenderingJson());

  private readonly isPreviewing = signal<boolean>(true);
  isPreviewing$ = computed(() => this.isPreviewing());

  constructor(
    private readonly dialog: MatDialog,
    private readonly editorService: EditorService,
    private readonly xlsxHelper: XlsxHelper
  ) {}

  // TODO: data types
  handleReadXlsxAction(data: any): void {
    this.dataSource.set(data.jsonData);
    this.updateDisplayData(this.xlsxHelper.filterNonEmptyData(data.jsonData));
  }

  handleSwitchSheetAction(data: any) {
    this.dataSource.set(data.jsonData);
    this.displayedDataSource.set(
      this.xlsxHelper.filterNonEmptyData(data.jsonData)
    );
    this.displayedColumns.set(
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

    for (const jsonString of this.xlsxHelper.unfixedableJsonString) {
      failedEvents.push({
        failedEvents: jsonString
      });
    }
    this.displayedFailedEvents.set(failedEvents);
    this.displayedDataSource.set(combinedData);
    this.displayedColumns.set(['Spec']);

    if (
      this.displayedDataSource().length > 0 &&
      this.displayedDataSource()[0].Spec === null
    ) {
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
    return cleanedGtmSpecs.filter((spec) => spec?.event);
  }

  updateDisplayData(data: any) {
    this.displayedDataSource.set(data);
    this.displayedColumns.set(Object.keys(data[0]));
  }

  processAndSetSpecsContent(data: DataRow[]): void {
    const events = this.processSpecs(data);
    this.editorService.setContent(
      EditorTypeEnum.INPUT_JSON,
      JSON.stringify(events, null, 2)
    );
  }

  resetDisplayData() {
    this.dataSource.set([]);
    this.displayedDataSource.set([]);
    this.displayedColumns.set([]);
    this.isRenderingJson.set(false);
    this.isPreviewing.set(true);
    this.displayedFailedEvents.set([]);
  }

  setIsRenderingJson(isRenderingJson: boolean) {
    this.isRenderingJson.set(isRenderingJson);
  }

  setIsPreviewing(isPreviewing: boolean) {
    this.isPreviewing.set(isPreviewing);
  }
}
