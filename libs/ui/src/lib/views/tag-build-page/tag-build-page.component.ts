import { EditorComponent } from '../../components/editor/editor.component';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FunctionalCardComponent } from '../../components/functional-card/functional-card.component';
import { ErrorDialogComponent } from '../../components/error-dialog/error-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ProjectSpec } from '@utils';
import { JsonPipe, NgIf } from '@angular/common';
import { ArticleComponent } from '../../components/article/article.component';
import { FileUploadDialogComponent } from '../../components/file-upload-dialog/file-upload-dialog.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { UploadActionComponent } from '../../components/upload-action/upload-action.component';
@Component({
  selector: 'lib-tag-build-page',
  standalone: true,
  imports: [
    NgIf,
    JsonPipe,
    FunctionalCardComponent,
    ArticleComponent,
    FooterComponent,
    UploadActionComponent,
    FileUploadDialogComponent,
    EditorComponent,
    ErrorDialogComponent,
  ],
  templateUrl: './tag-build-page.component.html',
  styleUrls: ['./tag-build-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagBuildPageComponent {
  @Input() projectSpecs: ProjectSpec | null = null;

  constructor(private dialog: MatDialog) {}

  openDialog(data: any) {
    this.dialog.open(ErrorDialogComponent, {
      data: {
        message: data.message,
      },
    });
  }
}
