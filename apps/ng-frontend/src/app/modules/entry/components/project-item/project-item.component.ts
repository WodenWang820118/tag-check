import { Component, input, ChangeDetectionStrategy } from '@angular/core';
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
import {
  take,
  map,
  switchMap,
  EMPTY,
  tap,
  catchError,
  Observable,
  forkJoin
} from 'rxjs';
import { ProjectIoService } from '../../../../shared/services/api/project-io/project-io.service';
import { MetadataSourceService } from '../../../../shared/services/data-source/metadata-source.service';

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
  project = input.required<Project>();
  constructor(
    private readonly dialog: MatDialog,
    private readonly projectIoService: ProjectIoService,
    private readonly metadataSourceService: MetadataSourceService
  ) {}

  deleteProject() {
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

    dialogRef
      .afterClosed()
      .pipe(
        take(1),
        switchMap((result) => {
          if (result) {
            return forkJoin({
              metadataUpdate: this.updateMetadata(),
              projectDeletion: this.projectIoService.deleteProject(
                this.project().projectSlug
              )
            });
          }
          return EMPTY;
        }),
        catchError((err) => {
          console.error(err);
          return EMPTY;
        })
      )
      .subscribe();
  }

  private updateMetadata(): Observable<Project[]> {
    return this.metadataSourceService.getData().pipe(
      take(1),
      map((data) =>
        data.filter(
          (project) => project.projectSlug !== this.project().projectSlug
        )
      ),
      tap((filteredData) => {
        this.metadataSourceService.setData(filteredData);
      })
    );
  }
}
