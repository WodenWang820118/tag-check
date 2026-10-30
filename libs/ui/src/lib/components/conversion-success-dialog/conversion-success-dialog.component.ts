import {
  Component,
  computed,
  Inject,
  signal,
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

/**
 * A host that can store the built container on a project, such as TagCheck.
 * The standalone tag-build site does not set this, so the dialog only
 * offers download and copy.
 *
 * Passed as the `projectImport` input of `TagBuildPageComponent` (and from
 * there into this dialog). TagCheck sets it through `NgComponentOutlet`.
 */
export interface ProjectContainerImport {
  /** Button label, for example "Import into this project". */
  label: string;
  /**
   * Imports `container`, the conversion this dialog is showing. Resolves
   * true when the import finished, and the dialog closes. Resolves false
   * when the user cancels, and the dialog stays open so the container can
   * still be downloaded or copied.
   */
  run: (container: GTMConfiguration) => Promise<boolean>;
}

export interface ConversionSuccessDialogData {
  configuration: GTMConfiguration;
  projectSlug?: string;
  /**
   * Set when the host can import the container into a project. Omitted by
   * the standalone site.
   */
  projectImport?: ProjectContainerImport;
}

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
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
 * container JSON, copies it, or, when the host provides
 * {@link ProjectContainerImport}, imports it into the current project.
 * The summary counts tags, triggers and variables on the output container.
 */
@Component({
  selector: 'lib-conversion-success-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <div class="conversion-success"></div>
    <h2 mat-dialog-title class="secondary">Conversion Successful</h2>
    <mat-dialog-content class="conversion-success__options">
      <p class="conversion-success__summary" data-testid="tagbuild-summary">
        {{ containerSummary }}
      </p>
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
      @if (projectImport; as importAction) {
        <div class="conversion-success__options__option">
          <button
            mat-stroked-button
            data-testid="tagbuild-import-project"
            [disabled]="!canExport() || importing()"
            (click)="onImport()"
          >
            <mat-icon>upload</mat-icon>{{ importAction.label }}
          </button>
        </div>
      }
    </mat-dialog-content>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    `
      /* Plain CSS equivalent of previous nested/SCSS rules */
      .conversion-success__options .mat-icon {
        transform: scale(1.5);
      }

      .conversion-success__summary {
        margin: 0 0 1.6rem;
        font-size: 1.4rem;
      }

      .conversion-success__options__option:not(:last-child) {
        margin-bottom: 1rem;
      }
    `
  ]
})
export class ConversionSuccessDialogComponent {
  /** True while the host import is in flight, so a second click cannot start another. */
  readonly importing = signal(false);

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

  /** Tags, triggers and variables on the container this dialog is showing. */
  get containerSummary(): string {
    const { tag, trigger, variable } = this.configuration.containerVersion;
    return [
      countLabel(tag.length, 'tag', 'tags'),
      countLabel(trigger.length, 'trigger', 'triggers'),
      countLabel(variable.length, 'variable', 'variables')
    ].join(' · ');
  }

  get projectImport(): ProjectContainerImport | null {
    return this.data.projectImport ?? null;
  }

  /**
   * Imports the container this dialog is showing. The button stays disabled
   * once the editor output no longer matches that container, so the host
   * receives the current output.
   */
  async onImport(): Promise<void> {
    const projectImport = this.projectImport;
    if (!projectImport || !this.canExport() || this.importing()) {
      return;
    }
    this.importing.set(true);
    try {
      const imported = await projectImport.run(this.configuration);
      if (imported) {
        this.dialog.closeAll();
        return;
      }
    } catch (error: unknown) {
      console.error('Could not import the container into the project', error);
    }
    this.importing.set(false);
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
