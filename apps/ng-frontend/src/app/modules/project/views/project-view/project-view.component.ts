import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProjectInfoService } from '../../../../shared/services/api/project-info/project-info.service';
import { Observable, Subject, take, takeUntil, tap, timer } from 'rxjs';
import { ProjectInfo, ProjectSetting } from '@utils';
import { ReportTableComponent } from '../../components/report-table/report-table.component';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { ToolbarComponent } from '../../../../shared/components/toolbar/toolbar.component';
import { SideNavListComponent } from '../../components/side-nav-list/side-nav-list.component';
import { SettingsService } from '../../../../shared/services/api/settings/settings.service';

@Component({
  selector: 'app-project-view',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    ReportTableComponent,
    MatSidenavModule,
    MatListModule,
    MatGridListModule,
    ToolbarComponent,
    SideNavListComponent,
  ],
  templateUrl: './project-view.component.html',
  styleUrls: ['./project-view.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ProjectViewComponent implements OnInit, OnDestroy {
  project$!: Observable<ProjectSetting>;
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
        })
      )
      .subscribe();

    this.projectInfoService
      .getProjects()
      .pipe(
        takeUntil(this.destroy$),
        tap((projects) => {
          this.projectInfo = projects;
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
