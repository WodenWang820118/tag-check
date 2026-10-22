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
import { EventBusService, EditorFacadeService } from '@data-access';
import {
  isMeasurementPlanHeader,
  measurementPlanToDataLayerSpecs,
  parseMeasurementPlanRows
} from '@utils';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

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
          accept=".json,.xlsx,.csv"
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
    private readonly eventBusService: EventBusService,
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

  handFileToSidenavForm(file: File) {
    this.dialog.closeAll();
    this.eventBusService.emit('toggleDrawer', file);
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
      } else if (fileExtension === 'xlsx') {
        this.selectedFile = file;
        this.handFileToSidenavForm(file);
      } else if (fileExtension === 'csv') {
        this.selectedFile = file;
        await this.handleMeasurementPlanFile(file);
      } else {
        this.selectedFile = null;
        this.dialog.open(ErrorDialogComponent, {
          data: {
            message: 'Please upload a valid JSON, XLSX, or CSV file.'
          }
        });
      }
    }
  }

  async handleMeasurementPlanFile(file: File): Promise<void> {
    try {
      const { readMeasurementPlanFile } =
        await import('./measurement-plan-spreadsheet');
      if (!this.importPlanTable(await readMeasurementPlanFile(file))) {
        this.dialog.open(ErrorDialogComponent, {
          data: {
            message:
              'A CSV file must be a measurement plan: download the plan template for its columns.'
          }
        });
      }
    } catch (err) {
      this.dialog.open(ErrorDialogComponent, {
        data: {
          message: `Failed to read spreadsheet file: ${String(err)}`
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
