import { Component, OnDestroy, OnInit } from '@angular/core';
import { ProjectListComponent } from '../../components/project-list/project-list.component';
import { ProjectInfoService } from '../../../../shared/services/api/project-info/project-info.service';
import { Observable, Subject } from 'rxjs';
import { ProjectInfo } from '@utils';

@Component({
  selector: 'app-home-view',
  standalone: true,
  imports: [ProjectListComponent],
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
      padding: 2rem 40rem;
    }
  }
  `,
})
export class HomeViewComponent implements OnInit {
  projects$!: Observable<ProjectInfo[]>;
  destroy$ = new Subject<void>();
  constructor(private projectInfoService: ProjectInfoService) {}

  ngOnInit(): void {
    console.log('HomeViewComponent initialized');
    this.projects$ = this.projectInfoService.getProjects();
  }
}
