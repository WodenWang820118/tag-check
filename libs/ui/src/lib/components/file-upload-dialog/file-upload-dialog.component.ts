import {
  Component,
  computed,
  effect,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { MatDialog, MatDialogContent } from '@angular/material/dialog';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';
import { EditorFacadeService } from '@data-access';
import {
  parseLegacySpecsTable,
  parsePlanTable,
  type TableImportResult
} from './table-import';
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
  templateUrl: './file-upload-dialog.component.html',
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

      .file-upload-dialog__help {
        margin-top: 1.5rem;
        padding: 0.8rem 1rem;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        background: #f9f9f9;
        font-size: 1.3rem;
        line-height: 1.5;
      }

      .file-upload-dialog__help-summary {
        font-weight: 600;
        cursor: pointer;
        user-select: none;
      }

      .file-upload-dialog__help-content {
        margin-top: 0.8rem;
      }

      .file-upload-dialog__help-content p {
        margin: 0.4rem 0;
      }

      .file-upload-dialog__help-content code {
        background: #eee;
        padding: 0.1rem 0.3rem;
        border-radius: 3px;
        font-size: 1.2rem;
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
        await this.handleJsonFile(file);
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
    const { readMeasurementPlanFile } =
      await import('./measurement-plan-spreadsheet');

    let table: string[][];
    try {
      table = await readMeasurementPlanFile(file);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.selectedFile = null;
      this.dialog.open(ErrorDialogComponent, {
        data: { message: `Failed to read spreadsheet file: ${message}` }
      });
      return;
    }

    if (this.importPlanTable(table)) {
      return;
    }
    if (this.importLegacySpecsTable(table)) {
      return;
    }

    this.selectedFile = null;
    this.dialog.open(ErrorDialogComponent, {
      data: {
        message:
          'The uploaded file is neither a measurement plan (expected headers: event_name, event_parameters, item_parameters) nor a dataLayer Specs spreadsheet.'
      }
    });
  }

  /** Return true for recognized invalid input as well, preventing another format from handling it. */
  importPlanTable(table: string[][]): boolean {
    return this.applyTableImportResult(parsePlanTable(table));
  }

  /** Return true for recognized invalid input as well, preventing another format from handling it. */
  importLegacySpecsTable(table: string[][]): boolean {
    return this.applyTableImportResult(parseLegacySpecsTable(table));
  }

  private applyTableImportResult(result: TableImportResult): boolean {
    if (result.kind === 'unrecognized') {
      return false;
    }

    if (result.kind === 'invalid') {
      this.selectedFile = null;
      this.dialog.open(ErrorDialogComponent, {
        data: {
          message: result.message
        }
      });
      return true;
    }

    this.editorFacadeService.inputJsonContent = result.specs;
    this.dialog.closeAll();
    return true;
  }

  async handleJsonFile(file: File): Promise<void> {
    await this.readJsonFileContent(file);
  }

  async readJsonFileContent(file: File): Promise<void> {
    let fileContentString: string;
    try {
      fileContentString = await file.text();
    } catch (err) {
      console.error('Error reading file:', err);
      this.dialog.open(ErrorDialogComponent, {
        data: {
          message: 'Error reading file. Please try again.'
        }
      });
      return;
    }

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
  }
}
