import { Injectable } from '@angular/core';
import { ReportService } from '../../../../shared/services/api/report/report.service';
import { EditorService } from '../../../../shared/services/editor/editor.service';
import { firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { UtilsService } from '../../../../shared/services/utils/utils.service';
import { SpecService } from '../../../../shared/services/api/spec/spec.service';
import { RecordingService } from '../../../../shared/services/api/recording/recording.service';
import { ErrorDialogComponent } from '@ui';
import { Recording, Spec } from '@utils';

@Injectable({
  providedIn: 'root'
})
export class ReportDetailPanelsFacadeService {
  constructor(
    private reportService: ReportService,
    private recordingService: RecordingService,
    private specService: SpecService,
    private editorService: EditorService,
    private dialog: MatDialog,
    private utilsService: UtilsService
  ) {}

  onRecordingFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file: File | null = target.files?.[0] || null;
    if (file) {
      this.recordingService.readRecordingJsonFileContent(file);
    } else {
      throw new Error('No file selected');
    }
  }

  onSpecFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file: File | null = target.files?.[0] || null;
    if (file) {
      this.specService.readSpecJsonFileContent(file);
    } else {
      throw new Error('No file selected');
    }
  }

  async onSpecUpdate(projectSlug: string, eventId: string) {
    const editor = await firstValueFrom(
      this.editorService.editor$.specJsonEditor
    );

    const specContent = editor.state.doc.toString();

    try {
      const parsedContent = JSON.parse(specContent);

      if (
        projectSlug &&
        eventId &&
        !this.utilsService.isEmptyObject(parsedContent)
      ) {
        await firstValueFrom(
          this.specService.updateSpec(projectSlug, eventId, parsedContent)
        );
      } else {
        this.showErrorDialog('Spec content is required and cannot be empty.');
      }
    } catch (err) {
      this.showErrorDialog('Invalid spec content');
    }
  }

  async onRecordingUpdate(projectSlug: string, eventId: string) {
    const editor = await firstValueFrom(
      this.editorService.editor$.recordingJsonEditor
    );

    const recordingContent = editor.state.doc.toString();

    try {
      const parsedContent = JSON.parse(recordingContent);

      if (
        projectSlug &&
        eventId &&
        !this.utilsService.isEmptyObject(parsedContent)
      ) {
        await firstValueFrom(
          this.recordingService.updateRecording(
            projectSlug,
            eventId,
            parsedContent
          )
        );
      } else {
        this.showErrorDialog(
          'Recording content is required and cannot be empty.'
        );
      }
    } catch (err) {
      this.showErrorDialog('Invalid recording content');
    }
  }

  onDownload(projectSlug: string, eventId: string) {
    if (projectSlug && eventId) {
      this.reportService.downloadFile(projectSlug, eventId);
    } else {
      this.showErrorDialog('Project slug and event name are required.');
    }
  }

  private showErrorDialog(message: string) {
    this.dialog.open(ErrorDialogComponent, {
      data: {
        message: message
      }
    });
  }

  setTempRecordingFileContent(content: Recording | null) {
    this.recordingService.setTempRecording(content);
  }

  setTempSpecFileContent(content: Spec | null) {
    this.specService.setTempSpec(content);
  }

  // for reading file content via api and setting it in the editor
  setRecordingFileContent(content: Recording) {
    this.recordingService.setRecording(content);
  }

  setSpecFileContent(content: Spec) {
    this.specService.setSpec(content);
  }

  get tempRecordingFileContent$() {
    return this.recordingService.tempRecordingContent$();
  }

  get tempSpecFileContent$() {
    return this.specService.tempSpecContent$();
  }

  get recordingFileContent$() {
    return this.recordingService.recordingContent$();
  }

  get specFileContent$() {
    return this.specService.specContent$();
  }

  get isJsonSyntaxError() {
    return this.editorService.isJsonSyntaxError$;
  }
}
