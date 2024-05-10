import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ProjectInfo } from '@utils';

@Component({
  selector: 'app-project-item',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <div class="project-item">
      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-card-title>{{ project.projectName }}</mat-card-title>
          <mat-card-subtitle>{{ project.projectSlug }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>{{ project.projectDescription }}</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .mat-mdc-card {
      height: 200px;
    }
  `,
})
export class ProjectItemComponent {
  @Input() project!: ProjectInfo;
}
