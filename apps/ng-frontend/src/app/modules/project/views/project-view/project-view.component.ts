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
  templateUrl: './project-view.component.html',
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
