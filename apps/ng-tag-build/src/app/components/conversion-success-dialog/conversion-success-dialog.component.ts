import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { SharedModule } from '../../shared.module';

@Component({
  selector: 'app-conversion-success-dialog',
  standalone: true,
  imports: [SharedModule],
  template: `
    <div class="conversion-success"></div>
    <h2 mat-dialog-title>Conversion Successful</h2>
    <mat-dialog-content class="conversion-success__options">
      <div class="conversion-success__options__option">
        <button mat-stroked-button (click)="onDownload()">
          <mat-icon>cloud_download</mat-icon>Download
        </button>
      </div>
      <div class="conversion-success__options__option">
        <button mat-stroked-button (click)="onClipBoard()">
          <mat-icon>file_copy</mat-icon>Copy to clipboard
        </button>
      </div>
    </mat-dialog-content>
  `,
  styles: [
    `
      .conversion-success {
        &__options {
          .mat-icon {
            transform: scale(1.5);
          }

          &__option:not(:last-child) {
            margin-bottom: 1rem;
          }
        }
      }
    `,
  ],
})
export class ConversionSuccessDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public configuration: any,
    private dialog: MatDialog
  ) {}

  onDownload() {
    const json = JSON.stringify(this.configuration, null, 2);
    // Create a Blob from the JSON string
    let blob = new Blob([json], { type: 'application/json' }),
      url = URL.createObjectURL(blob);
    // Create a link and programmatically click it
    let a = document.createElement('a');
    a.href = url;
    a.download = 'data.json'; // or any other name you want
    a.click(); // this will start download
    // Clean up after the download to avoid memory leaks
    URL.revokeObjectURL(url);
    this.dialog.closeAll();

    window.dataLayer.push({
      event: 'btn_download_click',
    });
  }

  onClipBoard() {
    const json = JSON.stringify(this.configuration, null, 2);
    navigator.clipboard.writeText(json).then(
      () => {
        console.log('Async: Copying to clipboard was successful!');
        this.dialog.closeAll();

        window.dataLayer.push({
          event: 'btn_copy_click',
        });
      },
      (err) => {
        console.error('Async: Could not copy text: ', err);
      }
    );
  }
}
