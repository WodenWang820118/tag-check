import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarComponent } from '../../../../shared/components/toolbar/toolbar.component';
import { ProjectListComponent } from '../../components/project-list/project-list.component';
import { ProjectInfoService } from '../../../../shared/services/api/project-info/project-info.service';
import { Observable } from 'rxjs';
import { ProjectInfo } from '@utils';

@Component({
  selector: 'app-home-view',
  standalone: true,
  imports: [CommonModule, ToolbarComponent, ProjectListComponent],
  template: `
    <div class="home">
      <div class="home__projects">
        <app-project-list [projects]="projects$"></app-project-list>
      </div>
    </div>
  `,
  styles: `
    .home {
    &__projects {
      padding: 2rem 10rem;
    }
  }
  `,
})
export class HomeViewComponent {
  projects$: Observable<ProjectInfo[]>;
  constructor(private projectInfoService: ProjectInfoService) {
    this.projects$ = this.projectInfoService.getProjects();
  }
}
