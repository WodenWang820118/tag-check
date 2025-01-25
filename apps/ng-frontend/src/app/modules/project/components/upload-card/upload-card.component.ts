import { Component, effect, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, mergeMap, take, timer } from 'rxjs';
import { IReportDetails, ReportDetailsDto, Spec } from '@utils';
import { SpecService } from '../../../../shared/services/api/spec/spec.service';
import { UploadSpecService } from '../../../../shared/services/upload-spec/upload-spec.service';
import { EditorComponent } from '../../../../shared/components/editor/editor.component';
import { RecordingService } from '../../../../shared/services/api/recording/recording.service';
import { ReportService } from '../../../../shared/services/api/report/report.service';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-upload-card',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, EditorComponent],
  templateUrl: './upload-card.component.html',
  styles: [``]
})
export class UploadCardComponent {
  importedSpec = signal<string>('');

  constructor(
    private uploadSpecService: UploadSpecService,
    private specService: SpecService,
    private route: ActivatedRoute,
    private reportService: ReportService,
    private recordingService: RecordingService
  ) {
    effect(() => {
      if (this.uploadSpecService.isUploaded()) {
        console.log('Upload complete');
      }
    });
  }
  onFileSelected(event: any) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = reader.result as string;
        const parsedSpec = JSON.parse(result) as Spec[];

        if (this.uploadSpecService.existKeys(parsedSpec)) {
          this.importedSpec.set(result);
        } else {
          alert('Invalid spec');
        }
      } catch (error) {
        alert('Error parsing file');
      }
    };
    reader.readAsText(file);
  }

  emitUploadComplete() {
    this.uploadSpecService.completeUpload();
  }

  save() {
    try {
      this.route.params
        .pipe(
          take(1),
          mergeMap((params) => {
            const projectSlug: string = params['projectSlug'];
            const specs = JSON.parse(this.importedSpec()) as Spec[];

            // Flatten the array of observables
            const requests = specs.map((spec) => {
              const eventId = uuidv4();
              const reportDetails: IReportDetails = new ReportDetailsDto({
                eventId: eventId,
                testName: spec.event,
                eventName: 'Standard'
              });

              // Combine the three requests for each spec into a single observable
              return forkJoin({
                report: this.reportService.addReport(
                  projectSlug,
                  `${spec.event}_${eventId}`,
                  reportDetails
                ),
                recording: this.recordingService.addRecording(
                  projectSlug,
                  `${spec.event}_${eventId}`,
                  '{}'
                ),
                spec: this.specService.addSpec(projectSlug, spec)
              });
            });

            // Combine all spec requests
            return forkJoin(requests);
          })
        )
        .subscribe({
          next: (results) => {
            this.emitUploadComplete();
            // Only reload after successful save
            timer(1500)
              .pipe(take(1))
              .subscribe(() => {
                window.location.reload();
              });
          },
          error: (error) => {
            console.error('Failed to save specs:', error);
            this.emitUploadComplete();
          }
        });
    } catch (error) {
      console.error('Failed to parse specs:', error);
      this.emitUploadComplete();
    }
  }
}
