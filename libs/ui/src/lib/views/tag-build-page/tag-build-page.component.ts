import { EditorComponent } from '../../components/editor/editor.component';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FunctionalCardComponent } from '../../components/functional-card/functional-card.component';
import { ErrorDialogComponent } from '../../components/error-dialog/error-dialog.component';
import { UploadActionComponent } from '../../components/upload-action/upload-action.component';
import { FileUploadDialogComponent } from '../../components/file-upload-dialog/file-upload-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { EditorTypeEnum, Spec } from '@utils';
import { JsonPipe } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { TagBuildModeService, TagBuildMode } from '@data-access';

@Component({
  selector: 'lib-tag-build-page',
  standalone: true,
  imports: [
    JsonPipe,
    FunctionalCardComponent,
    EditorComponent,
    MatTabsModule,
    UploadActionComponent
  ],
  templateUrl: './tag-build-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagBuildPageComponent {
  specs = input.required<Spec[]>();
  inputExtension = EditorTypeEnum.INPUT_JSON;
  outputExtension = EditorTypeEnum.OUTPUT_JSON;

  // expose enum to template for comparisons
  readonly TagBuildMode = TagBuildMode;

  // two-way binding target for mat-tab-group selectedIndex
  get selectedIndex(): TagBuildMode {
    return this.tagBuildModeService.mode;
  }

  set selectedIndex(v: TagBuildMode) {
    this.tagBuildModeService.setMode(v ?? TagBuildMode.TagBuild);
  }

  constructor(
    private readonly dialog: MatDialog,
    private readonly tagBuildModeService: TagBuildModeService
  ) {}

  onUpload() {
    this.openFileUploadDialog();
  }

  openFileUploadDialog() {
    this.dialog.open(FileUploadDialogComponent);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openDialog(data: any) {
    this.dialog.open(ErrorDialogComponent, {
      data: {
        message: data.message
      }
    });
  }
}
