import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ProjectInfo } from '@utils';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { InformationDialogComponent } from '../../../../shared/components/information-dialog/information-dialog.component';
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
import { MetadataSourceService } from '../../../../shared/services/metadata-source/metadata-source.service';

@Component({
  selector: 'app-project-item',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, RouterLink],
  template: `
    <div class="project-item">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ project().projectName }}</mat-card-title>
          <mat-card-subtitle>{{ project().projectSlug }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (project().projectDescription) {
            <p>{{ project().projectDescription }}</p>
            <br />
            <br />
          } @else {
            <br />
            <br />
            <br />
            <br />
          }
        </mat-card-content>
        <mat-card-actions>
          <button
            mat-button
            [routerLink]="['/projects', project().projectSlug]"
            [state]="{ slug: project().projectSlug }"
            color="primary"
          >
            View
          </button>
          <button mat-button (click)="deleteProject()" color="warn">
            DELETE
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: `
    .mat-mdc-card {
      height: 200px;
    }
  `
})
export class ProjectItemComponent {
  project = input.required<ProjectInfo>();
  constructor(
    private dialog: MatDialog,
    private projectIoService: ProjectIoService,
    private metadataSourceService: MetadataSourceService
  ) {}

  deleteProject() {
    const dialogRef = this.dialog.open(InformationDialogComponent, {
      data: {
        title: 'Delete project',
        message: 'Are you sure you want to delete this project?',
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

  private updateMetadata(): Observable<ProjectInfo[]> {
    return this.metadataSourceService.getData().pipe(
      take(1),
      map((data) =>
        data.filter(
          (project) => project.projectSlug !== this.project().projectSlug
        )
      ),
      tap((filteredData) => {
        // console.log('filteredData', filteredData);
        this.metadataSourceService.setData(filteredData);
      })
    );
  }
}
