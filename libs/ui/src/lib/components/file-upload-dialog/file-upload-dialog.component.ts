import { Component, computed, effect, signal } from '@angular/core';
import { from } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';
import { EventBusService, EditorFacadeService } from '@data-access';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'lib-file-upload-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `<div class="file-upload-dialog">
    <mat-dialog-content class="file-upload-dialog__actions">
      <div class="file-upload-dialog__actions__action">
        <button type="button" mat-button (click)="fileInput.click()">
          <mat-icon>cloud_upload</mat-icon>
          Upload JSON File
        </button>
        <input
          hidden
          (change)="onFileSelected($event)"
          #fileInput
          type="file"
        />
      </div>
    </mat-dialog-content>
  </div>`,
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
        // Ensure the fileContent is a valid object (parsed JSON)
        if (typeof fileContent === 'object' && fileContent !== null) {
          this.editorFacadeService.inputJsonContent = fileContent as Record<
            string,
            unknown
          >;
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file: File | undefined = input?.files?.[0];

    if (file) {
      const fileExtension = file.name.split('.').pop();
      const fileType = file.type;

      if (fileExtension === 'json' && fileType === 'application/json') {
        this.selectedFile = file;
        this.handleJsonFile(file);
      } else if (
        fileExtension === 'xlsx' &&
        fileType ===
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ) {
        this.selectedFile = file;
        this.handFileToSidenavForm(file);
      } else {
        this.selectedFile = null;
        this.dialog.open(ErrorDialogComponent, {
          data: {
            message: 'Please upload a valid JSON file.'
          }
        });
      }
    }
  }

  handleJsonFile(file: File): void {
    this.readJsonFileContent(file);
  }

  readJsonFileContent(file: File): void {
    // Use the modern File.text() which returns a Promise<string>, convert to Observable
    from(file.text()).subscribe({
      next: (fileContentString: string) => {
        try {
          // update the file content
          this.fileContent.set(JSON.parse(fileContentString));
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
