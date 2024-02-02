import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InitProjectFormComponent } from '../../components/init-project-form/init-project-form.component';

@Component({
  selector: 'app-init-project-view',
  standalone: true,
  imports: [CommonModule, InitProjectFormComponent],
  template: `
    <div class="init-project">
      <div class="init-project__form">
        <app-init-project-form></app-init-project-form>
      </div>
    </div>
  `,
  styles: `
    .init-project {
      &__form {
        padding: 2rem 10rem;
      }
    }
  `,
})
export class InitProjectViewComponent {}
