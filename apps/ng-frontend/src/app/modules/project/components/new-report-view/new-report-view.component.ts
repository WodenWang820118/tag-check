import { ChangeDetectorRef, Component, input, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { EditorComponent } from '../../../../shared/components/editor/editor.component';
import { NewReportViewFacadeService } from './new-report-view-facade.service';
import { MatSidenav } from '@angular/material/sidenav';
import { take } from 'rxjs';
import { MatDividerModule } from '@angular/material/divider';
import {
  EditorService,
  EditorThemeStyles
} from '../../../../shared/services/editor/editor.service';

@Component({
  selector: 'app-new-report-view',
  standalone: true,
  imports: [
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    EditorComponent,
    MatDividerModule
  ],
  template: `
    <div class="new-report p-4">
      <form
        class="new-report__form space-y-6"
        [formGroup]="reportForm"
        (ngSubmit)="setEditorContent(); uploadReport()"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">Specification</h2>
          <div class="flex items-center gap-2">
            <button type="button" mat-button (click)="pasteSpecSample()">
              Paste sample
            </button>
            <button
              type="submit"
              mat-raised-button
              color="primary"
              [disabled]="jsonInvalid$()"
            >
              Submit
            </button>
          </div>
        </div>

        <!-- Editor for specification: reduced height -->
        <app-editor
          class="new-report__form__field w-full"
          [content]="exampleInputJson"
          [editorExtension]="'specJson'"
          [stylesOverride]="scrollerShortStyle"
        ></app-editor>

        <div class="my-4">
          <mat-divider></mat-divider>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-xl font-semibold">Chrome Recording</h2>
            <button
              type="button"
              mat-stroked-button
              class="mb-2"
              (click)="fileInput.click()"
            >
              Upload
            </button>
          </div>

          <!-- Editor for recording JSON: slightly smaller height -->
          <app-editor
            class="new-report__form__field w-full mb-4"
            [content]="'{}'"
            [editorExtension]="'recordingJson'"
            [stylesOverride]="scrollerShortStyle"
          ></app-editor>
        </div>

        <input
          hidden
          (change)="onFileSelected($event)"
          #fileInput
          type="file"
        />
      </form>
    </div>
  `,
  styleUrls: ['./new-report-view.component.scss']
})
export class NewReportViewComponent {
  sidenav = input.required<MatSidenav>();
  projectSlug = signal<string>('');
  scrollerShortStyle: EditorThemeStyles = {
    '.cm-scroller': { height: '30vh', width: '100%' }
  };
  jsonInvalid$ = this.editorService.jsonSyntaxError$.specJson;
  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly newReportViewFacadeService: NewReportViewFacadeService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly editorService: EditorService
  ) {
    this.route.data.subscribe((data) => {
      console.log('data: ', data);
      const projectSlug = data['projectSlug'];
      if (projectSlug) {
        this.projectSlug.set(projectSlug);
      }
    });
  }

  cancel() {
    this.newReportViewFacadeService.cancel();
  }

  onFileSelected(event: Event) {
    this.newReportViewFacadeService.onFileSelected(event);
  }

  setEditorContent() {
    this.newReportViewFacadeService.setEditorContent();
  }

  pasteSpecSample() {
    const sample = this.newReportViewFacadeService.exampleInputJson;
    this.editorService.setContent('specJson', sample);
  }

  uploadReport() {
    if (!this.projectSlug()) throw new Error('Project slug is required');
    this.newReportViewFacadeService
      .uploadReport(this.projectSlug())
      .pipe(take(1))
      .subscribe(() => {
        // force reload the page
        this.router.navigated = false;
        this.router.navigate([this.router.url]).then(() => {
          if (this.route.snapshot.data['reports']) {
            this.sidenav().close();
          }
        });
      });
    // force change detection; paired with runGuardsAndResolvers: 'always',
    this.changeDetectorRef.detectChanges();
    this.newReportViewFacadeService.completeUpload();
  }

  get exampleInputJson() {
    return `{}`;
  }

  get reportForm() {
    return this.newReportViewFacadeService.reportForm;
  }
}
