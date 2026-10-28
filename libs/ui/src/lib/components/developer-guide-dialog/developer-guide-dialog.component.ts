import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  buildDeveloperSnippets,
  formatAllDeveloperSnippets,
  type DeveloperSnippet,
  type StrictDataLayerEvent
} from '@utils';

export interface DeveloperGuideDialogData {
  specs: readonly StrictDataLayerEvent[];
}

/**
 * A dialog showing ready-to-copy dataLayer push snippets for developers,
 * built from the specs currently in Tag Build's input.
 */
@Component({
  selector: 'lib-developer-guide-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatIconModule
  ],
  templateUrl: './developer-guide-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    `
      .developer-guide-dialog__title {
        margin: 0;
        font-size: 1.8rem;
        font-weight: 600;
      }

      .developer-guide-dialog__content {
        min-width: 32rem;
        max-height: 70vh;
        overflow-y: auto;
      }

      .developer-guide-dialog__toolbar {
        display: flex;
        gap: 1rem;
        margin: 1rem 0 1.5rem;
      }

      .developer-guide-dialog__empty {
        padding: 2rem 0;
        color: #666;
        font-size: 1.4rem;
        text-align: center;
      }

      .developer-guide-dialog__list {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .developer-guide-dialog__card {
        border: 1px solid #ddd;
        border-radius: 6px;
        background: #fdfdfd;
        overflow: hidden;
      }

      .developer-guide-dialog__card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.6rem 1rem;
        background: #f0f0f0;
        border-bottom: 1px solid #ddd;
      }

      .developer-guide-dialog__event-name {
        font-weight: 600;
        font-size: 1.3rem;
      }

      .developer-guide-dialog__code {
        margin: 0;
        padding: 1rem;
        background: #282c34;
        color: #abb2bf;
        font-size: 1.25rem;
        font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
        line-height: 1.45;
        overflow-x: auto;
        white-space: pre;
      }
    `
  ]
})
export class DeveloperGuideDialogComponent {
  readonly snippets: readonly DeveloperSnippet[];

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public readonly data: DeveloperGuideDialogData | null,
    private readonly dialogRef: MatDialogRef<DeveloperGuideDialogComponent>
  ) {
    const rawSpecs = data?.specs ?? [];
    this.snippets = buildDeveloperSnippets(rawSpecs);
  }

  async onCopyAll(): Promise<void> {
    if (this.snippets.length === 0) {
      return;
    }
    const content = formatAllDeveloperSnippets(this.snippets);
    try {
      await navigator.clipboard.writeText(content);
    } catch (err: unknown) {
      console.error('Failed to copy snippets to clipboard', err);
    }
  }

  async onCopySnippet(snippet: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(snippet);
    } catch (err: unknown) {
      console.error('Failed to copy snippet to clipboard', err);
    }
  }

  onDownloadJs(): void {
    if (this.snippets.length === 0) {
      return;
    }
    const content = formatAllDeveloperSnippets(this.snippets);
    const blob = new Blob([content], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'dataLayer-snippets.js';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  close(): void {
    this.dialogRef.close();
  }
}
