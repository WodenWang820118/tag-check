import {
  Component,
  input,
  ChangeDetectionStrategy,
  inject
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Project } from '@utils';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import {
  InformationDialogComponent,
  InformationDialogData
} from '../../../../shared/components/information-dialog/information-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ProjectIoService } from '../../../../shared/services/api/project-io/project-io.service';
import { MetadataSourceService } from '../../../../shared/services/data-source/metadata-source.service';

/** A project's card on the home page, to open or delete the project. */
@Component({
  selector: 'app-project-item',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    RouterLink
  ],
  template: `
    <div class="project-item">
      <mat-card [attr.data-testid]="'project-card-' + project().projectSlug">
        <mat-card-header>
          <mat-card-title>{{ project().projectName }}</mat-card-title>
          <mat-card-subtitle>{{ project().projectSlug }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content class="project-item__description">
          <p>{{ project().projectDescription || 'No description' }}</p>
        </mat-card-content>
        <mat-card-actions class="project-item__actions">
          <button
            mat-flat-button
            [routerLink]="['/projects', project().projectSlug]"
            [state]="{ slug: project().projectSlug }"
            [attr.data-testid]="'project-open-' + project().projectSlug"
            color="primary"
          >
            Open
          </button>
          <button
            mat-icon-button
            type="button"
            aria-label="Delete project"
            matTooltip="Delete project"
            (click)="deleteProject()"
            [attr.data-testid]="'project-delete-' + project().projectSlug"
          >
            <mat-icon>delete_outline</mat-icon>
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: `
    .mat-mdc-card {
      height: 200px;
      min-width: 300px;
      display: flex;
      flex-direction: column;
    }
    .project-item__description {
      flex: 1;
    }
    .project-item__description p {
      margin: 8px 0 0;
      color: rgba(0, 0, 0, 0.7);
    }
    .project-item__actions {
      justify-content: space-between;
      padding: 8px 16px 16px;
    }
  `
})
export class ProjectItemComponent {
  private readonly dialog = inject(MatDialog);
  private readonly projectIoService = inject(ProjectIoService);
  private readonly metadataSourceService = inject(MetadataSourceService);

  readonly project = input.required<Project>();

  async deleteProject(): Promise<void> {
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

    try {
      const result = await firstValueFrom(dialogRef.afterClosed());
      if (result) {
        await Promise.all([
          this.updateMetadata(),
          firstValueFrom(
            this.projectIoService.deleteProject(this.project().projectSlug)
          )
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  private async updateMetadata(): Promise<void> {
    const data = await firstValueFrom(this.metadataSourceService.getData());
    const filteredData = data.filter(
      (project) => project.projectSlug !== this.project().projectSlug
    );
    this.metadataSourceService.setData(filteredData);
  }
}
