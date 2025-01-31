import { ChangeDetectorRef, Component, input, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { EditorComponent } from '../../../../shared/components/editor/editor.component';
import { NewReportViewFacadeService } from './new-report-view-facade.service';
import { MatSidenav } from '@angular/material/sidenav';

@Component({
  selector: 'app-new-report-view',
  standalone: true,
  imports: [
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    EditorComponent
  ],
  templateUrl: './new-report-view.component.html',
  styleUrls: ['./new-report-view.component.scss']
})
export class NewReportViewComponent {
  sidenav = input.required<MatSidenav>();
  projectSlug = signal<string>('');
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private newReportViewFacadeService: NewReportViewFacadeService,
    private changeDetectorRef: ChangeDetectorRef
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

  uploadReport() {
    if (!this.projectSlug()) throw new Error('Project slug is required');
    this.newReportViewFacadeService
      .uploadReport(this.projectSlug())
      .subscribe(() => {
        // force reload the page
        this.router.navigated = false;
        this.router.navigate([this.router.url]).then(() => {
          if (this.route.snapshot.data['reports']) {
            this.sidenav().toggle();
          }
        });
        // force change detection
        this.changeDetectorRef.detectChanges();
      });
  }

  get exampleInputJson() {
    return this.newReportViewFacadeService.exampleInputJson;
  }

  get reportForm() {
    return this.newReportViewFacadeService.reportForm;
  }
}
