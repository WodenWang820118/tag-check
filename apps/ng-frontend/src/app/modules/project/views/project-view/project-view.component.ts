import { Component, signal, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { timer } from 'rxjs';
import { IReportDetails, Project, ProjectSetting } from '@utils';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { ToolbarComponent } from '../../../../shared/components/toolbar/toolbar.component';
import { SideNavListComponent } from '../../components/side-nav-list/side-nav-list.component';

@Component({
  selector: 'app-project-view',
  standalone: true,
  imports: [
    RouterOutlet,
    MatSidenavModule,
    ToolbarComponent,
    SideNavListComponent
  ],
  template: `
    <div class="project-view">
      <!-- receive the $event from the toolbar and switch the project -->
      <app-toolbar
        [settings]="project()"
        [snav]="snav"
        [projects]="projectInfo()"
        (changeProject)="snav.close(); onChangeProject($event, snav)"
      ></app-toolbar>

      <mat-sidenav-container
        class="project-view__sidenav-container"
        [hasBackdrop]="true"
        (backdropClick)="snav.close()"
      >
        <mat-sidenav
          #snav
          [opened]="isProjectRoute()"
          [mode]="'over'"
          fixedTopGap="56"
        >
          <app-side-nav-list
            [snav]="snav"
            (menuClick)="snav.toggle()"
          ></app-side-nav-list>
        </mat-sidenav>
        <mat-sidenav-content>
          <div class="table-container">
            <router-outlet></router-outlet>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styleUrls: ['./project-view.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ProjectViewComponent {
  project = signal<ProjectSetting>({} as ProjectSetting);
  projectInfo = signal<Project[]>([]);
  reports = signal<IReportDetails[]>([]);
  isProjectRoute = signal<boolean>(false);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    this.route.data.subscribe((data) => {
      const projectSettings = data['projectSetting'];
      const projectInfo = data['projectInfo'];
      const report = data['reports'];
      this.project.set(projectSettings);
      this.projectInfo.set(projectInfo);
      this.reports.set(report);
    });

    // Subscribe to route parameters to check if we're in a project route
    this.route.params.subscribe((params) => {
      const urlParts = this.router.url.split('/');
      this.isProjectRoute.set(
        urlParts.length === 3 && // ['', 'projects', 'projectSlug']
          urlParts[1] === 'projects'
      );
    });
  }

  onChangeProject(projectSlug: string, snav: MatSidenav) {
    this.router.navigate(['/projects', projectSlug]);
    timer(700).subscribe(() => {
      snav.open();
    });
  }
}
