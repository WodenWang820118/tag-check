import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ProjectIoService } from '../../services/api/project-io/project-io.service';
import {
  InformationDialogComponent,
  InformationDialogData
} from '../information-dialog/information-dialog.component';

/** Settings > Export or delete: exports the project to a file or deletes it. */
@Component({
  selector: 'app-project-io-form',
  standalone: true,
  imports: [MatButtonModule, MatCardModule],
  templateUrl: './project-io-form.component.html',
  styleUrls: ['./project-io-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None
})
export class ProjectIoFormComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly projectIoService = inject(ProjectIoService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  async exportProject(): Promise<void> {
    try {
      const params = this.route.parent?.params
        ? await firstValueFrom(this.route.parent.params)
        : undefined;
      const projectSlug = params?.['projectSlug'];
      if (projectSlug) {
        this.projectIoService.exportProject(projectSlug);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async deleteProject(): Promise<void> {
    try {
      const params = this.route.parent?.params
        ? await firstValueFrom(this.route.parent.params)
        : undefined;
      const projectSlug = params?.['projectSlug'];
      if (!projectSlug) return;

      const dialogRef = this.dialog.open<
        InformationDialogComponent,
        InformationDialogData
      >(InformationDialogComponent, {
        data: {
          title: 'Delete project',
          contents: 'Are you sure you want to delete this project?',
          action: 'Delete'
        }
      });

      const dialogResult = await firstValueFrom(dialogRef.afterClosed());
      if (dialogResult) {
        await firstValueFrom(this.projectIoService.deleteProject(projectSlug));
        void this.router.navigate(['/']);
      }
    } catch (err) {
      console.error(err);
    }
  }
}
