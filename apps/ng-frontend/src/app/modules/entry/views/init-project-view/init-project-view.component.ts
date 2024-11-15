import { Component } from '@angular/core';
import { InitProjectFormComponent } from '../../components/init-project-form/init-project-form.component';
import { ProjectImportComponent } from '../../../../shared/components/project-import/project-import.component';

@Component({
  selector: 'app-init-project-view',
  standalone: true,
  imports: [InitProjectFormComponent, ProjectImportComponent],
  template: `
    <div class="init-project">
      <div class="init-project__form">
        <app-project-import></app-project-import>
        <app-init-project-form></app-init-project-form>
      </div>
    </div>
  `,
  styles: `
    .init-project {
      padding: 1rem 10rem;
      &__form {
        display: flex;
        flex-direction: column;
        gap: 3rem;
      }
    }
  `
})
export class InitProjectViewComponent {}
