import { Component } from '@angular/core';
import { EditorComponent } from '../editor/editor.component';
import { FunctionalCardComponent } from '../functional-card/functional-card.component';
import { ArticleComponent } from '../article/article.component';
import { FooterComponent } from '../footer/footer.component';
import { XlsxSidenavComponent } from '../xlsx-sidenav/xlsx-sidenav.component';
import { SharedModule } from '../../shared.module';
import { uploadActionComponent } from '../upload-action/upload-action.component';
import { FileUploadDialogComponent } from '../file-upload-dialog/file-upload-dialog.component';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [
    SharedModule,
    EditorComponent,
    FunctionalCardComponent,
    ArticleComponent,
    FooterComponent,
    XlsxSidenavComponent,
    uploadActionComponent,
    FileUploadDialogComponent,
    ErrorDialogComponent,
  ],
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss'],
})
export class MainPageComponent {
  exampleInputJson = ['Please input your JSON data or try JS object here'];

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
