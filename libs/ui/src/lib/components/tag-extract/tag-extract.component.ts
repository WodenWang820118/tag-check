import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
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
  type GTMConfiguration,
  type MeasurementPlanExtraction
} from '@utils';
import {
  buildExtractedMeasurementPlanCsv,
  downloadCsv,
  EXTRACTED_MEASUREMENT_PLAN_FILE_NAME
} from '../file-upload-dialog/measurement-plan-spreadsheet';

export type PlanExtractEvent = 'plan_extract' | 'plan_download';

/**
 * tag-build's Tag Extract tab: reads a container export, or the host
 * project's saved container when one is provided, and lists the GA4 events
 * its tags send as a measurement plan. The plan downloads as CSV and opens
 * in Tag Build. A note shared by more than one event is shown once above
 * the table; the CSV keeps every note on its row so the file stays
 * self-contained.
 */
@Component({
  selector: 'lib-tag-extract',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './tag-extract.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagExtractComponent {
  /**
   * The host project's saved container. The standalone site leaves this
   * unset. TagCheck passes null when the project has not imported one, and
   * the button stays hidden.
   */
  readonly projectContainer = input<GTMConfiguration | null>(null);

  readonly fileName = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly extraction = signal<MeasurementPlanExtraction | null>(null);
  readonly rows = computed(() => this.extraction()?.rows ?? []);

  /**
   * Notes that appear on more than one row, in first-seen order, with the
   * number of events they apply to. Those notes are lifted out of the rows.
   */
  readonly commonNotes = computed(() => {
    const counts = new Map<string, number>();
    for (const row of this.rows()) {
      for (const note of new Set(row.notes)) {
        counts.set(note, (counts.get(note) ?? 0) + 1);
      }
    }
    return [...counts]
      .filter(([, count]) => count > 1)
      .map(([note, count]) => ({ note, count }));
  });

  /** Plan rows with the shared notes removed. The CSV still uses {@link rows}. */
  readonly rowsWithOwnNotes = computed(() => {
    const shared = new Set(this.commonNotes().map((item) => item.note));
    return this.rows().map((row) => ({
      eventName: row.eventName,
      eventParameters: row.eventParameters,
      itemParameters: row.itemParameters,
      ownNotes: row.notes.filter((note) => !shared.has(note))
    }));
  });

  constructor(
    private readonly editorFacadeService: EditorFacadeService,
    private readonly tagBuildModeService: TagBuildModeService
  ) {}

  async onFileSelected(event: Event): Promise<void> {
    const fileInput = event.target as HTMLInputElement | null;
    const file = fileInput?.files?.[0];
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
      if (fileInput) {
        fileInput.value = '';
      }
    }
    this.extract(text);
  }

  /**
   * Extracts the host project's saved container the same way an uploaded
   * export is extracted.
   */
  useProjectContainer(): void {
    const container = this.projectContainer();
    if (!container) {
      return;
    }
    this.fileName.set("This project's container");
    this.showExtraction(container);
  }

  /** Extracts the plan from a container export's text. */
  extract(text: string): void {
    const { container, error } = parseGtmContainerExport(text);
    if (!container) {
      this.showError(error);
      return;
    }
    this.showExtraction(container);
  }

  private showExtraction(container: GTMConfiguration): void {
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
