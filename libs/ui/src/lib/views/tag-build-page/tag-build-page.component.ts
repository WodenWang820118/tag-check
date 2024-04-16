import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { EditorComponent } from '../../components/editor/editor.component';
import { FunctionalCardComponent } from '../../components/functional-card/functional-card.component';
import { SharedModule } from '../../shared.module';
import { ErrorDialogComponent } from '../../components/error-dialog/error-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ProjectSpec } from '@utils';

@Component({
  selector: 'lib-tag-build-page',
  standalone: true,
  imports: [
    SharedModule,
    EditorComponent,
    FunctionalCardComponent,
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
