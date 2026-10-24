import { EditorComponent } from '../../components/editor/editor.component';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FunctionalCardComponent } from '../../components/functional-card/functional-card.component';
import { UploadActionComponent } from '../../components/upload-action/upload-action.component';
import { FileUploadDialogComponent } from '../../components/file-upload-dialog/file-upload-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { EditorTypeEnum, StrictDataLayerEvent } from '@utils';
import { JsonPipe } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { TagBuildModeService, TagBuildMode } from '@data-access';

/**
 * tag-build's main view: the Tag Build and Tag Extract tabs with the input
 * and output JSON editors, the convert card and the spec upload.
 */
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
  specs = input.required<StrictDataLayerEvent[]>();
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
}
