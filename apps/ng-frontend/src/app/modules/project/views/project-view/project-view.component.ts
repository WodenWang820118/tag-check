import { AsyncPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { ProjectInfoService } from '../../../../shared/services/api/project-info/project-info.service';
import {
  catchError,
  Observable,
  Subject,
  take,
  takeUntil,
  tap,
  timer,
} from 'rxjs';
import { ProjectInfo, ProjectSetting } from '@utils';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { ToolbarComponent } from '../../../../shared/components/toolbar/toolbar.component';
import { SideNavListComponent } from '../../components/side-nav-list/side-nav-list.component';
import { SettingsService } from '../../../../shared/services/api/settings/settings.service';

@Component({
  selector: 'app-project-view',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterOutlet,
    MatSidenavModule,
    ToolbarComponent,
    SideNavListComponent,
  ],
  templateUrl: './project-view.component.html',
  styleUrls: ['./project-view.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ProjectViewComponent implements OnInit, OnDestroy {
  project$!: Observable<ProjectSetting | null>;
  projectInfo!: ProjectInfo[];
  destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    public projectInfoService: ProjectInfoService,
    private settingsService: SettingsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(
        take(1),
        tap((params) => {
          // console.log(params);
          this.project$ = this.settingsService.switchToProject(
            params['projectSlug']
          );
        }),
        catchError((err) => {
          console.error(err);
          return [];
        })
      )
      .subscribe();

    this.projectInfoService
      .getProjects()
      .pipe(
        takeUntil(this.destroy$),
        tap((projects) => {
          this.projectInfo = projects;
        }),
        catchError((error) => {
          console.error('Error: ', error);
          return [];
        })
      )
      .subscribe();
  }

  onChangeProject(projectSlug: string, snav: MatSidenav) {
    this.project$ = this.settingsService.switchToProject(projectSlug);
    this.router.navigate(['/projects', projectSlug]);
    timer(700).subscribe(() => {
      snav.open();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
