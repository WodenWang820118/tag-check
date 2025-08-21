import { EditorComponent } from '../../components/editor/editor.component';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FunctionalCardComponent } from '../../components/functional-card/functional-card.component';
import { ErrorDialogComponent } from '../../components/error-dialog/error-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { EditorTypeEnum, Spec } from '@utils';
import { JsonPipe } from '@angular/common';
@Component({
  selector: 'lib-tag-build-page',
  standalone: true,
  imports: [JsonPipe, FunctionalCardComponent, EditorComponent],
  templateUrl: './tag-build-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagBuildPageComponent {
  specs = input.required<Spec[]>();
  inputExtension = EditorTypeEnum.INPUT_JSON;
  outputExtension = EditorTypeEnum.OUTPUT_JSON;

  constructor(private readonly dialog: MatDialog) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openDialog(data: any) {
    this.dialog.open(ErrorDialogComponent, {
      data: {
        message: data.message
      }
    });
  }
}
