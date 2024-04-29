import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RootFormComponent } from '../../../../shared/components/root-form/root-form.component';

@Component({
  selector: 'app-global-settings-view',
  standalone: true,
  imports: [CommonModule, RootFormComponent],
  template: `
    <div class="global-settings">
      <!-- TODO: the root form doesn't get the current root folder -->
      <app-root-form></app-root-form>
    </div>
  `,
  styles: `
    .global-settings {
      padding: 5rem 10rem;
      display: flex;
      height: 100%;
    }
  `,
})
export class GlobalSettingsViewComponent {}
