import { Component } from '@angular/core';
import { EditorComponent } from '../../components/editor/editor.component';
import { FunctionalCardComponent } from '../../components/functional-card/functional-card.component';
import { ArticleComponent } from '../../components/article/article.component';
import { XlsxSidenavComponent } from '../../components/xlsx-sidenav/xlsx-sidenav.component';
import { FileUploadDialogComponent } from '../../components/file-upload-dialog/file-upload-dialog.component';
import { ErrorDialogComponent } from '../../components/error-dialog/error-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { UploadActionComponent } from '../../components/upload-action/upload-action.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { JsonPipe } from '@angular/common';
import { EditorTypeEnum } from '@utils';

@Component({
  selector: 'lib-tag-build-app',
  standalone: true,
  imports: [
    JsonPipe,
    MatSidenavModule,
    EditorComponent,
    FunctionalCardComponent,
    ArticleComponent,
    XlsxSidenavComponent,
    UploadActionComponent
  ],
  templateUrl: './tag-build-app.component.html',
  styleUrls: ['./tag-build-app.component.scss']
})
export class TagBuildAppComponent {
  exampleInputJson = [];
  inputExtension = EditorTypeEnum.INPUT_JSON;
  outputExtension = EditorTypeEnum.OUTPUT_JSON;

  constructor(private dialog: MatDialog) {}
  onUpload() {
    this.openFileUploadDialog();
  }

  openFileUploadDialog() {
    this.dialog.open(FileUploadDialogComponent);
  }

  openDialog(data: any) {
    this.dialog.open(ErrorDialogComponent, {
      data: {
        message: data.message
      }
    });
  }
}
