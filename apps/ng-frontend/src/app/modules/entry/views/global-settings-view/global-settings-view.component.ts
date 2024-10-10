import { Component } from '@angular/core';
import { RootFormComponent } from '../../../../shared/components/root-form/root-form.component';

@Component({
  selector: 'app-global-settings-view',
  standalone: true,
  imports: [RootFormComponent],
  template: `
    <div class="global-settings">
      <app-root-form></app-root-form>
    </div>
  `,
  styles: `
    .global-settings {
      padding: 5rem 10rem;
      justify-content: center;
      display: flex;
      height: 100%;
    }
  `,
})
export class GlobalSettingsViewComponent {}
