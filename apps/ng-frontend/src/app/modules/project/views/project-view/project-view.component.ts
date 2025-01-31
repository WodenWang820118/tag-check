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
  project = signal<ProjectSetting | null>(null);
  projectInfo = signal<Project[]>([]);
  reports = signal<IReportDetails[]>([]);

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.data.subscribe((data) => {
      const projectSettings = data['projectSetting'];
      const projectInfo = data['projectInfo'];
      const report = data['reports'];
      this.project.set(projectSettings);
      this.projectInfo.set(projectInfo);
      this.reports.set(report);
    });
  }

  onChangeProject(projectSlug: string, snav: MatSidenav) {
    this.router.navigate(['/projects', projectSlug]);
    timer(700).subscribe(() => {
      snav.open();
    });
  }
}
