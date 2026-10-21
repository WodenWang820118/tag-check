import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ProjectListComponent } from '../../components/project-list/project-list.component';

@Component({
  selector: 'app-home-view',
  standalone: true,
  imports: [ProjectListComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <main class="mx-auto w-full max-w-6xl px-4">
      <h1 class="mt-8 mb-6 text-3xl font-medium text-gray-800">Projects</h1>
      <app-project-list></app-project-list>
    </main>
  `
})
export class HomeViewComponent {}
