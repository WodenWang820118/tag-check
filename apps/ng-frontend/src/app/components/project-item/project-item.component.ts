import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Project } from '../../models/project.interface';

@Component({
  selector: 'app-project-item',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="project-item">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ project.projectName }}</mat-card-title>
          <mat-card-subtitle>{{ project.testType }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>{{ project.projectDescription }}</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: ``,
})
export class ProjectItemComponent {
  @Input() project!: Project;
}