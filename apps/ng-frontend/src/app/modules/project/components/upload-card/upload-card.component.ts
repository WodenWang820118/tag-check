import { Component, effect, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { catchError, forkJoin, of, take, tap } from "rxjs";
import { Spec } from "@utils";
import { SpecService } from "../../../../shared/services/api/spec/spec.service";
import { UploadSpecService } from "../../../../shared/services/upload-spec/upload-spec.service";
import { EditorComponent } from "../../../../shared/components/editor/editor.component";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: 'app-upload-card',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    EditorComponent,
  ],
  templateUrl: './upload-card.component.html',
  styles: [``],
})
export class UploadCardComponent {
  importedSpec = signal<string>('');

  constructor(private uploadSpecService: UploadSpecService, private specService: SpecService, private route: ActivatedRoute) {
    effect(() => {
      if (this.uploadSpecService.isUploaded()) {
        console.log('Upload complete');
      }
    })
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
      this.route.params.pipe(take(1)).subscribe(params => {
        const projectSlug = params['projectSlug'];
        const specs = JSON.parse(this.importedSpec()) as Spec[];
        const requests = specs.map(spec =>
          this.specService.addSpec(projectSlug, spec).pipe()
        );

        forkJoin(requests)
          .pipe(
            take(1),
            tap(results => {
              const failures = results.filter(result => result !== null && 'error' in result);
              const successes = results.filter(result => result !== null && !('error' in result));

              if (failures.length > 0) {
                console.warn(`Failed to save ${failures.length} specs`);
                // Handle failures (e.g., show error message)
              }

              if (successes.length > 0) {
                console.log(`Successfully saved ${successes.length} specs`);
                // Handle success (e.g., show success message)
              }
            }),
            catchError(error => {
              console.error('Failed to save specs:', error);
              // Handle overall failure
              return of([]);
            })
          )
          .subscribe();
      });
    } catch (error) {
      console.error('Failed to parse specs:', error);
      // Handle JSON parse error
    } finally {
      this.emitUploadComplete();
    }
  }

}
