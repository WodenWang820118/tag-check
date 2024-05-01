import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProjectInfoService } from '../../../../shared/services/api/project-info/project-info.service';
import { Observable, Subject, takeUntil, tap } from 'rxjs';
import { ProjectSetting } from '@utils';
import { ReportTableComponent } from '../../components/report-table/report-table.component';
import { MatSidenavModule } from '@angular/material/sidenav';
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
  destroy$ = new Subject<void>();
  hover = false;

  constructor(
    private route: ActivatedRoute,
    public projectInfoService: ProjectInfoService,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        tap((params) => {
          // console.log(params);
          this.project$ = this.settingsService.switchToProject(
            params['projectSlug']
          );
        })
      )
      .subscribe();
  }

  switchHover() {
    this.hover = !this.hover;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
