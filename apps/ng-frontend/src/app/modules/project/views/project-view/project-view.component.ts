import { Component, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { ProjectInfoService } from '../../../../shared/services/api/project-info/project-info.service';
import { timer } from 'rxjs';
import { ProjectSetting } from '@utils';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { ToolbarComponent } from '../../../../shared/components/toolbar/toolbar.component';
import { SideNavListComponent } from '../../components/side-nav-list/side-nav-list.component';
import { SettingsService } from '../../../../shared/services/api/settings/settings.service';
import { toSignal } from '@angular/core/rxjs-interop';

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
  // State signals
  params = toSignal(this.route.params, {
    initialValue: { projectSlug: '' }
  });

  project = toSignal(
    this.settingsService.getProjectSettings(this.params().projectSlug),
    {
      initialValue: undefined
    }
  );
  projectInfo = toSignal(this.projectInfoService.getProjects(), {
    initialValue: []
  });

  // Convert project$ observable to signal
  readonly currentProject = toSignal<ProjectSetting | null>(
    this.settingsService.currentProject$,
    { initialValue: null }
  );

  constructor(
    private route: ActivatedRoute,
    public projectInfoService: ProjectInfoService,
    private settingsService: SettingsService,
    private router: Router
  ) {}

  onChangeProject(projectSlug: string, snav: MatSidenav) {
    this.router.navigate(['/projects', projectSlug]);
    timer(700).subscribe(() => {
      snav.open();
    });
  }
}
