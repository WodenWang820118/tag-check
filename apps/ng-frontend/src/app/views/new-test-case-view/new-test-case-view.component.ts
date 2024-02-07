import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../services/project/project.service';
import { Observable } from 'rxjs';
import { Project } from '../../models/project.interface';

@Component({
  selector: 'app-new-test-case-view',
  standalone: true,
  imports: [CommonModule],
  template: ` <div class="detail">Detail View Works</div> `,
  styles: `
    
  `,
})
export class NewTestCaseViewComponent {
  projects$: Observable<Project[]>;
  constructor(private projectService: ProjectService) {
    this.projects$ = this.projectService.getProjects();
  }
}
