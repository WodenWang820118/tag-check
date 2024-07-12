import { Component } from '@angular/core';
import { ProjectListComponent } from '../../components/project-list/project-list.component';

@Component({
  selector: 'app-home-view',
  standalone: true,
  imports: [ProjectListComponent],
  template: `
    <div class="home">
      <div class="home__projects">
        <app-project-list></app-project-list>
      </div>
    </div>
  `,
  styles: `
    .home {
    &__projects {
      margin-top: 2rem;
    }
  }
  `,
})
export class HomeViewComponent {}
