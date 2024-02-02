import { Component, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Project } from '../../models/project.interface';
import { EventEmitter } from '@angular/core';

@Component({
  selector: 'app-side-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sidenav">
      <h3>{{ (project$ | async)?.projectName }}</h3>
      <p>{{ (project$ | async)?.testType }}</p>
    </div>
  `,
  styles: `
   .sidenav {
      margin-top: 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
   }
  `,
})
export class SideNavbarComponent {
  @Input() projects$!: Observable<Project[]>;
  @Input() project$!: Observable<Project>;
  @Output() switchedProject = new EventEmitter();
}
