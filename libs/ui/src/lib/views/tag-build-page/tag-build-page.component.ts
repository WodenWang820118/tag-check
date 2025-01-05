import { EditorComponent } from '../../components/editor/editor.component';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FunctionalCardComponent } from '../../components/functional-card/functional-card.component';
import { ErrorDialogComponent } from '../../components/error-dialog/error-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { EditorTypeEnum, ProjectSpec } from '@utils';
import { JsonPipe } from '@angular/common';
@Component({
  selector: 'lib-tag-build-page',
  standalone: true,
  imports: [JsonPipe, FunctionalCardComponent, EditorComponent],
  templateUrl: './tag-build-page.component.html',
  styleUrls: ['./tag-build-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagBuildPageComponent {
  @Input() projectSpecs: ProjectSpec | null = null;
  inputExtension = EditorTypeEnum.INPUT_JSON;
  outputExtension = EditorTypeEnum.OUTPUT_JSON;

  constructor(private dialog: MatDialog) {}

  openDialog(data: any) {
    this.dialog.open(ErrorDialogComponent, {
      data: {
        message: data.message
      }
    });
  }
}
