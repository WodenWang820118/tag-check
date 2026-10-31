import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import { EditorFacadeService } from '@data-access';
import {
  measurementPlanToDataLayerSpecs,
  parseMeasurementPlanRows
} from '@utils';
import {
  buildMeasurementPlanCsv,
  downloadCsv,
  MEASUREMENT_PLAN_FILE_NAME
} from '../file-upload-dialog/measurement-plan-spreadsheet';
import {
  PlanEditorService,
  type PlanEditorTableRow
} from './plan-editor.service';

/**
 * An in-app measurement plan editor table: allows keying in event rows
 * with GA4 rule syntax, validating them against GA4 reference rules,
 * applying them directly to the input JSON editor, or downloading them as CSV.
 */
@Component({
  selector: 'lib-plan-editor-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose
  ],
  templateUrl: './plan-editor-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: []
})
export class PlanEditorDialogComponent implements OnInit {
  private readonly planEditorService = inject(PlanEditorService);
  private readonly editorFacadeService = inject(EditorFacadeService);
  private readonly dialogRef = inject(MatDialogRef<PlanEditorDialogComponent>, {
    optional: true
  });

  readonly rows = this.planEditorService.rows;

  readonly validationResult = computed(() => {
    const table = [
      ['event_name', 'event_parameters', 'item_parameters'],
      ...this.rows().map((r) => [
        r.eventName,
        r.eventParameters,
        r.itemParameters
      ])
    ];
    return parseMeasurementPlanRows(table);
  });

  /**
   * The parser numbers rows as CSV lines, the header being row 1; the table
   * has no header row, so its rows are numbered one lower.
   */
  readonly issues = computed(() =>
    this.validationResult().issues.map((issue) =>
      issue.replace(
        /^Row (\d+):/,
        (_, row: string) => `Row ${Number(row) - 1}:`
      )
    )
  );
  readonly parsedRows = computed(() => this.validationResult().rows);
  readonly canUsePlan = computed(
    () => this.issues().length === 0 && this.parsedRows().length > 0
  );

  ngOnInit(): void {
    if (this.rows().length === 0) {
      this.planEditorService.addRow();
    }
  }

  addEvent(): void {
    this.planEditorService.addRow();
  }

  deleteRow(index: number): void {
    this.planEditorService.deleteRow(index);
  }

  onCellInput(
    index: number,
    field: keyof PlanEditorTableRow,
    event: Event
  ): void {
    if (event.target instanceof HTMLInputElement) {
      this.planEditorService.updateRow(index, field, event.target.value);
    }
  }

  usePlan(): void {
    const { rows, issues } = this.validationResult();
    if (issues.length > 0 || rows.length === 0) {
      return;
    }
    const specs = measurementPlanToDataLayerSpecs(rows);
    this.editorFacadeService.inputJsonContent = specs;
    this.dialogRef?.close();
  }

  downloadCsv(): void {
    const filled = this.rows().filter(
      (r) =>
        r.eventName.trim() !== '' ||
        r.eventParameters.trim() !== '' ||
        r.itemParameters.trim() !== ''
    );
    downloadCsv(buildMeasurementPlanCsv(filled), MEASUREMENT_PLAN_FILE_NAME);
  }
}
