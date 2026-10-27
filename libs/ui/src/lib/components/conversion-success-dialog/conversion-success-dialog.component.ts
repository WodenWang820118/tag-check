import {
  Component,
  computed,
  Inject,
  ChangeDetectionStrategy
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GTMConfiguration } from '@utils';
import { EditorFacadeService } from '@data-access';

export interface ConversionSuccessDialogData {
  configuration: GTMConfiguration;
  projectSlug?: string;
}

/**
 * Events pushed to the tag-build site's dataLayer when a container is exported.
 * GA4 has no recommended event for this, and its automatic `file_download`
 * covers links to files only, so these are custom events named under GA4's
 * naming rules.
 * @see https://support.google.com/analytics/answer/13316687
 * @see https://support.google.com/analytics/answer/9216061
 */
export type ContainerExportEvent = 'container_download' | 'container_copy';

/**
 * Shown after a conversion that passed the import checks: downloads the
 * container JSON or copies it to the clipboard.
 */
@Component({
  selector: 'lib-conversion-success-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <div class="conversion-success"></div>
    <h2 mat-dialog-title class="secondary">Conversion Successful</h2>
    <mat-dialog-content class="conversion-success__options">
      <div class="conversion-success__options__option">
        <button
          mat-stroked-button
          data-testid="tagbuild-download"
          [disabled]="!canExport()"
          (click)="onDownload()"
        >
          <mat-icon>cloud_download</mat-icon>Download
        </button>
      </div>
      <div class="conversion-success__options__option">
        <button
          mat-stroked-button
          data-testid="tagbuild-copy"
          [disabled]="!canExport()"
          (click)="onClipBoard()"
        >
          <mat-icon>file_copy</mat-icon>Copy to clipboard
        </button>
      </div>
    </mat-dialog-content>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    `
      /* Plain CSS equivalent of previous nested/SCSS rules */
      .conversion-success__options .mat-icon {
        transform: scale(1.5);
      }

      .conversion-success__options__option:not(:last-child) {
        margin-bottom: 1rem;
      }
    `
  ]
})
export class ConversionSuccessDialogComponent {
  readonly canExport = computed(
    () =>
      this.editorFacadeService.outputJsonContent() ===
      JSON.stringify(this.configuration, null, 2)
  );

  constructor(
    @Inject(MAT_DIALOG_DATA) private readonly data: ConversionSuccessDialogData,
    private readonly editorFacadeService: EditorFacadeService,
    private readonly dialog: MatDialog
  ) {}

  get configuration(): GTMConfiguration {
    return this.data.configuration;
  }

  onDownload() {
    if (!this.canExport()) return;
    const json = this.editorFacadeService.outputJsonContent();
    // Create a Blob from the JSON string
    const blob = new Blob([json], { type: 'application/json' }),
      url = URL.createObjectURL(blob);
    // Create a link and programmatically click it
    const a = document.createElement('a');
    a.href = url;
    const prefix = this.data.projectSlug ? `${this.data.projectSlug}-` : '';
    // The user's own calendar date: toISOString would give UTC's, which is
    // a day off in the early morning east of UTC.
    const now = new Date();
    const date = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    ].join('-');
    a.download = `${prefix}gtm-container-${date}.json`;
    a.click(); // this will start download
    // Clean up after the download to avoid memory leaks
    URL.revokeObjectURL(url);
    this.trackExport('container_download');
    this.dialog.closeAll();
  }

  onClipBoard() {
    if (!this.canExport()) return;
    const json = this.editorFacadeService.outputJsonContent();
    navigator.clipboard.writeText(json).then(
      () => {
        this.trackExport('container_copy');
        this.dialog.closeAll();
      },
      (err) => {
        console.error('Async: Could not copy text: ', err);
      }
    );
  }

  /**
   * Counts exports on the public tag-build site, which loads GTM. The app
   * embedded in TagCheck has no dataLayer, so nothing is pushed there.
   */
  private trackExport(event: ContainerExportEvent): void {
    const { dataLayer } = globalThis as {
      dataLayer?: Array<Record<string, unknown>>;
    };
    const { tag, trigger, variable } = this.configuration.containerVersion;
    dataLayer?.push({
      event,
      tag_count: tag.length,
      trigger_count: trigger.length,
      variable_count: variable.length
    });
  }
}
