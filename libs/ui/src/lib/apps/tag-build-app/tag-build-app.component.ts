import { Component } from '@angular/core';
import { EditorComponent } from '../../components/editor/editor.component';
import { FunctionalCardComponent } from '../../components/functional-card/functional-card.component';
import { ArticleComponent } from '../../components/article/article.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { XlsxSidenavComponent } from '../../components/xlsx-sidenav/xlsx-sidenav.component';
import { SharedModule } from '../../shared.module';
import { FileUploadDialogComponent } from '../../components/file-upload-dialog/file-upload-dialog.component';
import { ErrorDialogComponent } from '../../components/error-dialog/error-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { UploadActionComponent } from '../../components/upload-action/upload-action.component';

@Component({
  selector: 'lib-tag-build-app',
  standalone: true,
  imports: [
    SharedModule,
    EditorComponent,
    FunctionalCardComponent,
    ArticleComponent,
    FooterComponent,
    XlsxSidenavComponent,
    UploadActionComponent,
    FileUploadDialogComponent,
    ErrorDialogComponent,
  ],
  templateUrl: './tag-build-app.component.html',
  styleUrls: ['./tag-build-app.component.scss'],
})
export class TagBuildAppComponent {
  exampleInputJson = ['Please input your JSON data here'];

  constructor(private dialog: MatDialog) {}
  onUpload() {
    this.openFileUploadDialog();
    window.dataLayer.push({
      event: 'btn_upload_click',
    });
  }

  openFileUploadDialog() {
    this.dialog.open(FileUploadDialogComponent);
  }

  openDialog(data: any) {
    this.dialog.open(ErrorDialogComponent, {
      data: {
        message: data.message,
      },
    });
  }
}
