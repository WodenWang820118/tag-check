import {
  Component,
  computed,
  effect,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { from } from 'rxjs';
import { MatDialog, MatDialogContent } from '@angular/material/dialog';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';
import { EditorFacadeService } from '@data-access';
import {
  extractDataLayerPushes,
  isMeasurementPlanHeader,
  measurementPlanToDataLayerSpecs,
  parseMeasurementPlanRows,
  StrictDataLayerEvent
} from '@utils';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * tag-build's upload dialog: reads specs from a JSON file, or from a CSV
 * measurement plan or "dataLayer Specs" sheet, into the input editor, and
 * downloads the measurement plan template.
 */
@Component({
  selector: 'lib-file-upload-dialog',
  standalone: true,
  imports: [MatDialogContent, MatButtonModule, MatIconModule],
  template: `<div class="file-upload-dialog">
    <mat-dialog-content class="file-upload-dialog__actions">
      <div class="file-upload-dialog__actions__action">
        <button type="button" mat-button (click)="fileInput.click()">
          <mat-icon>cloud_upload</mat-icon>
          Upload File
        </button>
        <input
          hidden
          (change)="onFileSelected($event)"
          #fileInput
          type="file"
          accept=".json,.csv"
        />
      </div>
      <div class="file-upload-dialog__actions__action">
        <button
          type="button"
          mat-button
          (click)="downloadPlanTemplate()"
          data-testid="tagbuild-plan-template-download"
        >
          <mat-icon>download</mat-icon>
          Download plan template
        </button>
      </div>
    </mat-dialog-content>
  </div>`,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    `
      .file-upload-dialog__actions .mat-icon {
        transform: scale(1.5);
      }

      .file-upload-dialog__actions {
        width: 100%;
        margin: auto;
      }

      .file-upload-dialog__actions__action button {
        margin-right: 1rem;
      }

      .file-upload-dialog__actions__action:not(:last-child) {
        margin-bottom: 1rem;
      }
    `
  ]
})
export class FileUploadDialogComponent {
  selectedFile: File | null = null;
  fileContent = signal<Record<string, unknown> | null>(null);
  fileContent$ = computed(() => this.fileContent());

  constructor(
    public dialog: MatDialog,
    private readonly editorFacadeService: EditorFacadeService
  ) {
    effect(() => {
      const fileContent = this.fileContent$();
      if (fileContent !== null) {
        if (typeof fileContent === 'object' && fileContent !== null) {
          this.editorFacadeService.inputJsonContent = fileContent;
          this.dialog.closeAll();
        } else {
          this.dialog.open(ErrorDialogComponent, {
            data: {
              message: 'Uploaded file content is not valid JSON object.'
            }
          });
        }
      }
    });
  }

  async downloadPlanTemplate(): Promise<void> {
    const { downloadMeasurementPlanTemplate } =
      await import('./measurement-plan-spreadsheet');
    downloadMeasurementPlanTemplate();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const file: File | undefined = input?.files?.[0];

    if (file) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'json') {
        this.selectedFile = file;
        this.handleJsonFile(file);
      } else if (fileExtension === 'csv') {
        this.selectedFile = file;
        await this.handleMeasurementPlanFile(file);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        this.selectedFile = null;
        this.dialog.open(ErrorDialogComponent, {
          data: {
            message:
              'Save the spreadsheet as CSV (UTF-8) and upload the .csv file.'
          }
        });
      } else {
        this.selectedFile = null;
        this.dialog.open(ErrorDialogComponent, {
          data: {
            message: 'Please upload a valid JSON or CSV file.'
          }
        });
      }
    }
  }

  async handleMeasurementPlanFile(file: File): Promise<void> {
    try {
      const { readMeasurementPlanFile } =
        await import('./measurement-plan-spreadsheet');
      const table = await readMeasurementPlanFile(file);
      if (this.importPlanTable(table)) {
        return;
      }
      if (this.importLegacySpecsTable(table)) {
        return;
      }
      this.dialog.open(ErrorDialogComponent, {
        data: {
          message:
            'A CSV file must be a measurement plan (event_name, event_parameters, item_parameters) or include a "dataLayer Specs" column.'
        }
      });
    } catch (err) {
      this.dialog.open(ErrorDialogComponent, {
        data: {
          message: `Failed to read spreadsheet file: ${err instanceof Error ? err.message : String(err)}`
        }
      });
    }
  }

  /**
   * Imports a measurement plan from a parsed sheet table.
   * If the first row is the plan header, parses it, opens an error dialog on issues,
   * or sets the converted dataLayer specs on the input JSON editor.
   * Returns true if the table was handled as a measurement plan, false otherwise.
   */
  importPlanTable(table: string[][]): boolean {
    if (table.length === 0 || !isMeasurementPlanHeader(table[0])) {
      return false;
    }
    const { rows, issues } = parseMeasurementPlanRows(table);
    if (issues.length > 0) {
      this.dialog.open(ErrorDialogComponent, {
        data: {
          message: issues.join('\n')
        }
      });
      return true;
    }
    const specs = measurementPlanToDataLayerSpecs(rows);
    this.editorFacadeService.inputJsonContent = specs;
    this.dialog.closeAll();
    return true;
  }

  /**
   * Imports dataLayer specs from a parsed sheet table containing a "dataLayer Specs" column.
   * If any issues are found, opens the error dialog with spreadsheet row numbers and imports nothing.
   * Otherwise, sets the extracted dataLayer specs on the input JSON editor and closes the dialog.
   * Returns true if the table was handled as a legacy specs table, false otherwise.
   */
  importLegacySpecsTable(table: string[][]): boolean {
    if (table.length === 0) {
      return false;
    }
    const headerRow = table[0];
    const dataLayerSpecsColIndex = headerRow.findIndex(
      (cell) => cell.trim().toLowerCase() === 'datalayer specs'
    );
    if (dataLayerSpecsColIndex === -1) {
      return false;
    }

    const allSpecs: StrictDataLayerEvent[] = [];
    const allIssues: string[] = [];

    for (let rowIndex = 1; rowIndex < table.length; rowIndex++) {
      const row = table[rowIndex];
      const cellValue = row[dataLayerSpecsColIndex];
      if (!cellValue || cellValue.trim() === '') {
        continue;
      }
      const rowNumber = rowIndex + 1;
      const { specs, issues } = extractDataLayerPushes(cellValue);
      for (const issue of issues) {
        allIssues.push(`Row ${rowNumber}: ${issue}`);
      }
      allSpecs.push(...specs);
    }
    if (allIssues.length === 0 && allSpecs.length === 0) {
      allIssues.push(
        'The "dataLayer Specs" column has no dataLayer.push call with an event.'
      );
    }

    if (allIssues.length > 0) {
      this.dialog.open(ErrorDialogComponent, {
        data: {
          message: allIssues.join('\n')
        }
      });
      return true;
    }

    this.editorFacadeService.inputJsonContent = allSpecs;
    this.dialog.closeAll();
    return true;
  }

  handleJsonFile(file: File): void {
    this.readJsonFileContent(file);
  }

  readJsonFileContent(file: File): void {
    from(file.text()).subscribe({
      next: (fileContentString: string) => {
        try {
          this.fileContent.set(
            JSON.parse(fileContentString) as Record<string, unknown>
          );
        } catch (error) {
          console.error('Error parsing JSON file:', error);
          this.dialog.open(ErrorDialogComponent, {
            data: {
              message: 'Error parsing JSON file. Please try again.'
            }
          });
        }
      },
      error: (err) => {
        console.error('Error reading file:', err);
        this.dialog.open(ErrorDialogComponent, {
          data: {
            message: 'Error reading file. Please try again.'
          }
        });
      }
    });
  }
}
