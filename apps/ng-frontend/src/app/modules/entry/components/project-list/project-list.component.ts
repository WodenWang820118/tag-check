import { RouterLink } from '@angular/router';
import { Component, Input } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ProjectItemComponent } from '../project-item/project-item.component';
import { MatCardModule } from '@angular/material/card';
import { Observable } from 'rxjs';
import { ProjectInfo } from '@utils';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [AsyncPipe, ProjectItemComponent, MatCardModule, RouterLink],
  template: `
    <div class="project-list">
      <div class="project-list__items">
        <div class="project-list__new" [routerLink]="['init-project']">
          <!-- TODO: icons and message to prompt user to create a new project -->
          <!-- TODO: upload project feature -->
          <mat-card>
            <mat-card-header>
              <mat-card-title>New Project</mat-card-title>
              <mat-card-subtitle>Create a new automation</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p></p>
            </mat-card-content>
          </mat-card>
        </div>
        @for (item of projects | async; track item.projectSlug) {
        <app-project-item
          [project]="item"
          [routerLink]="['/projects', item.projectSlug]"
          [state]="{ slug: item.projectSlug }"
        ></app-project-item>
        }
      </div>
    </div>
  `,
  styles: `
    .project-list {
      &__new {
        cursor: pointer;
      }

      &__items {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        grid-gap: 1rem;
        cursor: pointer;
      }
    }
  `,
})
export class ProjectListComponent {
  @Input() projects!: Observable<ProjectInfo[]>;
}
