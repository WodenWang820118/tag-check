import { ReportDetailPanelsFacadeService } from './report-detail-panels-facade.service';
import { AsyncPipe, JsonPipe } from '@angular/common';
import { Component, computed, input, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { IReportDetails, Spec } from '@utils';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { EditorComponent } from '../../../../shared/components/editor/editor.component';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
@Component({
  selector: 'app-report-datail-panels',
  standalone: true,
  imports: [
    AsyncPipe,
    JsonPipe,
    MatIconModule,
    MatExpansionModule,
    MatTooltipModule,
    EditorComponent,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './report-detail-panels.component.html',
  styleUrls: ['./report-detail-panels.component.scss']
})
export class ReportDetailPanelsComponent implements OnInit {
  // Input signals
  reportDetails = input<IReportDetails | undefined>(undefined);

  // State signals
  error = signal<string | null>(null);
  loading = signal(false);
  projectSlug = signal<string | null>(null);
  eventId = signal<string | null>(null);

  // Edit mode signals
  specEdit = signal(false);
  recordingEdit = signal(false);
  specEditMode = signal(false);
  recordingEditMode = signal(false);

  // Computed signals
  specContent = computed(() => {
    const specFileContent = this.reportDetailPanelsFacadeService.specContent$;
    const tempSpecFileContent =
      this.reportDetailPanelsFacadeService.tempSpecContent$;
    const result = tempSpecFileContent || specFileContent;
    console.log('Spec Content: ', result);
    return result;
  });

  recordingContent = computed(() => {
    const recordingFileContent =
      this.reportDetailPanelsFacadeService.recordingContent$;
    const tempRecordingFileContent =
      this.reportDetailPanelsFacadeService.tempRecordingContent$;
    const result = tempRecordingFileContent || recordingFileContent;
    console.log('Recording Content: ', result);
    return result;
  });

  constructor(
    private route: ActivatedRoute,
    private reportDetailPanelsFacadeService: ReportDetailPanelsFacadeService
  ) {}

  ngOnInit(): void {
    // Load data
    this.route.data.subscribe((data) => {
      console.log('Data: ', data);
      const projectSlug = data['projectSlug'];
      const eventId = data['eventId'];
      const spec = data['spec'] as Spec;
      const recording = data['recording'];

      this.projectSlug.set(projectSlug);
      this.eventId.set(eventId);

      this.reportDetailPanelsFacadeService.setRecordingFileContent(recording);
      this.reportDetailPanelsFacadeService.setSpecFileContent(
        (spec as any).dataLayerSpec
      );
    });
  }

  switchSpecEditMode(event: Event) {
    event.stopPropagation();
    this.reportDetailPanelsFacadeService.setTempSpecFileContent(null);
    this.specEditMode.update((prev) => !prev);
  }

  switchRecordingEditMode(event: Event) {
    event.stopPropagation();
    this.reportDetailPanelsFacadeService.setTempRecordingFileContent(null);
    this.recordingEditMode.update((prev) => !prev);
  }

  switchSpecEdit() {
    this.specEdit.update((prev) => !prev);
  }

  switchRecordingEdit() {
    this.recordingEdit.update((prev) => !prev);
  }

  onRecordingFileSelected(event: Event) {
    this.reportDetailPanelsFacadeService.onRecordingFileSelected(event);
  }

  onSpecFileSelected(event: Event) {
    this.reportDetailPanelsFacadeService.onSpecFileSelected(event);
  }

  onSpecUpdate() {
    const projectSlug = this.projectSlug();
    const eventId = this.eventId();
    if (!projectSlug || !eventId) {
      return;
    }
    this.reportDetailPanelsFacadeService.onSpecUpdate(projectSlug, eventId);
  }

  onRecordingUpdate() {
    const projectSlug = this.projectSlug();
    const eventId = this.eventId();
    if (!projectSlug || !eventId) {
      return;
    }
    this.reportDetailPanelsFacadeService.onRecordingUpdate(
      projectSlug,
      eventId
    );
  }

  onDownload() {
    const projectSlug = this.projectSlug();
    const eventId = this.eventId();
    if (!projectSlug || !eventId) {
      return;
    }
    this.reportDetailPanelsFacadeService.onDownload(projectSlug, eventId);
  }

  get isJsonSyntaxError() {
    return this.reportDetailPanelsFacadeService.isJsonSyntaxError;
  }

  get isSpecLoading() {
    return this.reportDetailPanelsFacadeService.isSpecLoading;
  }

  get isRecordingLoading() {
    return this.reportDetailPanelsFacadeService.isRecordingLoading;
  }
}
