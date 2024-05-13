import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  catchError,
  EMPTY,
  map,
  mergeMap,
  Subject,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectIoService } from '../../services/api/project-io/project-io.service';
import { InformationDialogComponent } from '../information-dialog/information-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-project-io-form',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, InformationDialogComponent],
  templateUrl: './project-io-form.component.html',
  styleUrls: ['./project-io-form.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ProjectIoFormComponent implements OnDestroy {
  destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private projectIoService: ProjectIoService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  exportProject() {
    this.route.parent?.params
      .pipe(
        take(1),
        tap((params) => {
          const projectSlug = params['projectSlug'];
          if (projectSlug) {
            this.projectIoService.exportProject(projectSlug);
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

  deleteProject() {
    this.route.parent?.params
      .pipe(
        take(1),
        mergeMap((params) => {
          const dialogRef = this.dialog.open(InformationDialogComponent, {
            data: {
              title: 'Delete project',
              message: 'Are you sure you want to delete this project?',
              action: 'Delete',
            },
          });

          return dialogRef.afterClosed().pipe(
            take(1),
            map((result) => {
              return { params, dialogResult: result };
            })
          );
        }),
        switchMap(({ params, dialogResult }) => {
          const projectSlug = params['projectSlug'];
          if (dialogResult && projectSlug) {
            return this.projectIoService.deleteProject(projectSlug);
          }
          return EMPTY;
        }),
        tap(() => {
          this.router.navigate(['/']);
        }),
        catchError((err) => {
          console.error(err);
          return EMPTY;
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
