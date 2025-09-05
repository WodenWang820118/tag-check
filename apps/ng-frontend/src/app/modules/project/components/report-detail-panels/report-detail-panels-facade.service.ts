import { Injectable } from '@angular/core';
import { ReportService } from '../../../../shared/services/api/report/report.service';
import { EditorService } from '../../../../shared/services/editor/editor.service';
import { Subscription, take } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { UtilsService } from '../../../../shared/services/utils/utils.service';
import { SpecService } from '../../../../shared/services/api/spec/spec.service';
import { RecordingService } from '../../../../shared/services/api/recording/recording.service';
import { DataLayerSpec, Recording } from '@utils';

@Injectable({
  providedIn: 'root'
})
export class ReportDetailPanelsFacadeService {
  errorDialogComponent = this.loadErrorDialogComponent();
  constructor(
    private readonly reportService: ReportService,
    private readonly recordingService: RecordingService,
    private readonly specService: SpecService,
    private readonly editorService: EditorService,
    private readonly dialog: MatDialog,
    private readonly utilsService: UtilsService
  ) {}

  private async loadErrorDialogComponent() {
    try {
      const module = await import('@ui');
      return module.ErrorDialogComponent;
    } catch (error) {
      console.error('Failed to load toolbar component:', error);
      return null;
    }
  }

  onRecordingFileSelected(event: Event) {
    this.recordingService.setLoading(true); // close spinner after file is read
    const target = event.target as HTMLInputElement;
    const file: File | null = target.files?.[0] || null;
    if (file) {
      this.recordingService.readRecordingJsonFileContent(file);
    } else {
      throw new Error('No file selected');
    }
  }

  onSpecFileSelected(event: Event) {
    this.specService.setLoading(true); // close spinner after file is read
    const target = event.target as HTMLInputElement;
    const file: File | null = target.files?.[0] || null;
    if (file) {
      this.specService.readSpecJsonFileContent(file);
    } else {
      throw new Error('No file selected');
    }
  }

  onSpecUpdate(projectSlug: string, eventId: string) {
    this.specService.setLoading(true);
    const specEditor = this.editorService.editor$.specJsonEditor();
    const content = specEditor.state.doc.toString();
    if (!this.utilsService.isEmptyObject(content)) {
      this.specService.setSpec(JSON.parse(content));
      return this.specService
        .updateSpec(projectSlug, eventId, JSON.parse(content))
        .pipe(take(1))
        .subscribe();
    }
    return new Subscription();
  }

  onRecordingUpdate(projectSlug: string, eventId: string) {
    const recordingEditor = this.editorService.editor$.recordingJsonEditor();
    const content = recordingEditor.state.doc.toString();
    if (!this.utilsService.isEmptyObject(content)) {
      this.recordingService.setRecording(JSON.parse(content));
      return this.recordingService
        .updateRecording(projectSlug, eventId, JSON.parse(content))
        .pipe(take(1))
        .subscribe();
    }
    return new Subscription();
  }

  onDownload(projectSlug: string, eventId: string) {
    if (projectSlug && eventId) {
      this.reportService.downloadFile(projectSlug, eventId);
    } else {
      this.showErrorDialog('Project slug and event name are required.');
    }
  }

  private async showErrorDialog(message: string) {
    const errorComponent = await this.errorDialogComponent;
    if (errorComponent !== null) {
      this.dialog.open(errorComponent, {
        data: {
          message: message
        }
      });
    }
  }

  setTempRecordingFileContent(content: Recording | null) {
    this.recordingService.setTempRecording(content);
  }

  setTempSpecFileContent(content: DataLayerSpec | null) {
    this.specService.setTempSpec(content);
  }

  // for reading file content via api and setting it in the editor
  setRecordingFileContent(content: Recording) {
    this.recordingService.setRecording(content);
  }

  setSpecFileContent(content: DataLayerSpec) {
    this.specService.setSpec(content);
  }

  get tempRecordingContent$() {
    return this.recordingService.tempRecordingContent$();
  }

  get tempSpecContent$() {
    return this.specService.tempSpecContent$();
  }

  get recordingContent$() {
    return this.recordingService.recordingContent$();
  }

  get specContent$() {
    return this.specService.specContent$();
  }

  get isJsonSyntaxError() {
    return this.editorService.isJsonSyntaxError$;
  }

  get isSpecLoading() {
    return this.specService.isLoading$();
  }

  get isRecordingLoading() {
    return this.recordingService.isLoading$();
  }
}
