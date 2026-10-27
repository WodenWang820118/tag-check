import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  EditorFacadeService,
  TagBuildMode,
  TagBuildModeService
} from '@data-access';
import {
  extractMeasurementPlan,
  measurementPlanToDataLayerSpecs,
  parseGtmContainerExport,
  type MeasurementPlanExtraction
} from '@utils';
import {
  buildExtractedMeasurementPlanCsv,
  downloadCsv,
  EXTRACTED_MEASUREMENT_PLAN_FILE_NAME
} from '../file-upload-dialog/measurement-plan-spreadsheet';

export type PlanExtractEvent = 'plan_extract' | 'plan_download';

/**
 * tag-build's Tag Extract tab: reads a container export, lists the GA4
 * events its tags send as a measurement plan, downloads the plan as CSV and
 * opens it in Tag Build.
 */
@Component({
  selector: 'lib-tag-extract',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './tag-extract.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagExtractComponent {
  readonly fileName = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly extraction = signal<MeasurementPlanExtraction | null>(null);
  readonly rows = computed(() => this.extraction()?.rows ?? []);

  constructor(
    private readonly editorFacadeService: EditorFacadeService,
    private readonly tagBuildModeService: TagBuildModeService
  ) {}

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }
    this.fileName.set(file.name);
    let text: string;
    try {
      text = await file.text();
    } catch (error) {
      this.showError(`The file could not be read: ${String(error)}`);
      return;
    } finally {
      // Choosing the same file again must still trigger a change.
      if (input) {
        input.value = '';
      }
    }
    this.extract(text);
  }

  /** Extracts the plan from a container export's text. */
  extract(text: string): void {
    const { container, error } = parseGtmContainerExport(text);
    if (!container) {
      this.showError(error);
      return;
    }
    const extraction = extractMeasurementPlan(container);
    this.error.set(null);
    this.extraction.set(extraction);
    this.track('plan_extract', {
      event_count: extraction.rows.length,
      skipped_count: extraction.skipped.length
    });
  }

  downloadPlan(): void {
    downloadCsv(
      buildExtractedMeasurementPlanCsv(this.rows()),
      EXTRACTED_MEASUREMENT_PLAN_FILE_NAME
    );
    this.track('plan_download', { event_count: this.rows().length });
  }

  /** Puts the plan's specs in Tag Build's input editor and switches to it. */
  openInTagBuild(): void {
    this.editorFacadeService.inputJsonContent = measurementPlanToDataLayerSpecs(
      this.rows()
    );
    this.tagBuildModeService.setMode(TagBuildMode.TagBuild);
  }

  private showError(message: string): void {
    this.extraction.set(null);
    this.error.set(message);
  }

  /**
   * Counts extractions on the public tag-build site, which loads GTM. The
   * app embedded in TagCheck has no dataLayer, so nothing is pushed there.
   */
  private track(
    event: PlanExtractEvent,
    parameters: Record<string, number>
  ): void {
    const { dataLayer } = globalThis as {
      dataLayer?: Array<Record<string, unknown>>;
    };
    dataLayer?.push({ event, ...parameters });
  }
}
