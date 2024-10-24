import { Component, AfterViewInit, OnDestroy } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { EditorComponent } from "../../../../shared/components/editor/editor.component";

@Component({
  selector: 'app-upload-card',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    EditorComponent,
  ],
  template: `
    <mat-card appearance="outlined" style="max-width: 650px;">
      <mat-card-header>
        <div>Import your specification here</div>
      </mat-card-header>
      <br />
      <mat-card-content>
        <button type="button" mat-stroked-button color="primary" (click)="fileInput.click()">
          <mat-icon>cloud_upload</mat-icon>
          Upload
        </button>
        <input
          hidden
          (change)="onFileSelected($event)"
          #fileInput
          type="file"
        />
        <div>
          <br />
        </div>
        @if (importedSpec) {
          <div style="max-width: 600px;">
            <app-editor [content]="importedSpec" [editorExtension]="'specJson'"></app-editor>
          </div>
          <div>
            <br />
          </div>
          <div style="display: flex; justify-content: flex-end">
            <button type="button" mat-stroked-button color="primary">
            Add to workspace
            </button>
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [``],
})
export class UploadCardComponent {
  importedSpec = '';

  onFileSelected(event: any) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.importedSpec = reader.result as string;
    };
    reader.readAsText(file);
  }
}
