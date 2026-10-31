import {
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  input,
  ChangeDetectionStrategy
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { EditorComponent } from '../../../../shared/components/editor/editor.component';
import { NewReportViewFacadeService } from './new-report-view-facade.service';
import { MatSidenav } from '@angular/material/sidenav';
import { firstValueFrom } from 'rxjs';
import { MatDividerModule } from '@angular/material/divider';
import {
  EditorService,
  EditorThemeStyles
} from '../../../../shared/services/editor/editor.service';

/**
 * The "Create a test manually" tab: a spec editor and a recording
 * editor; a Chrome recording can also be uploaded.
 */
@Component({
  selector: 'app-new-report-view',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    EditorComponent,
    MatDividerModule
  ],
  template: `
    <div class="new-report p-4">
      <form
        class="new-report__form space-y-6"
        (submit)="$event.preventDefault(); setEditorContent(); uploadReport()"
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
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./new-report-view.component.scss']
})
export class NewReportViewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly newReportViewFacadeService = inject(
    NewReportViewFacadeService
  );
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly editorService = inject(EditorService);

  readonly sidenav = input.required<MatSidenav>();
  private readonly routeData = toSignal(this.route.data);
  readonly projectSlug = computed(
    () => (this.routeData()?.['projectSlug'] as string | undefined) ?? ''
  );
  readonly scrollerShortStyle: EditorThemeStyles = {
    '.cm-scroller': { height: '30vh', width: '100%' }
  };
  readonly jsonInvalid$ = this.editorService.jsonSyntaxError$.specJson;
  readonly reportForm = this.newReportViewFacadeService.reportForm;

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

  async uploadReport(): Promise<void> {
    const slug = this.projectSlug();
    if (!slug) throw new Error('Project slug is required');
    try {
      await firstValueFrom(this.newReportViewFacadeService.uploadReport(slug), {
        defaultValue: undefined
      });
      // force reload the page
      this.router.navigated = false;
      await this.router.navigate([this.router.url]);
      if (this.route.snapshot?.data?.['reports']) {
        void this.sidenav().close();
      }
    } finally {
      // force change detection; paired with runGuardsAndResolvers: 'always',
      this.changeDetectorRef.detectChanges();
      this.newReportViewFacadeService.completeUpload();
    }
  }

  get exampleInputJson() {
    return `{}`;
  }
}
