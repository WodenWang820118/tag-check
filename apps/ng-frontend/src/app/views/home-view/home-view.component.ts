import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { ProjectListComponent } from '../../components/project-list/project-list.component';
import { ProjectService } from '../../services/project/project.service';
import { Observable } from 'rxjs';
import { Project } from '../../models/project.interface';

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
  projects$: Observable<Project[]>;
  constructor(private projectService: ProjectService) {
    this.projects$ = this.projectService.getProjects();
  }
}
