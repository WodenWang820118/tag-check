import { Component } from '@angular/core';
import { ProjectListComponent } from '../../components/project-list/project-list.component';

@Component({
  selector: 'app-home-view',
  standalone: true,
  imports: [ProjectListComponent],
  template: `
    <div>
      <div class="mt-8">
        <app-project-list></app-project-list>
      </div>
    </div>
  `
})
export class HomeViewComponent {}
