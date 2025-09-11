import { Component } from '@angular/core';
import { InitProjectFormComponent } from '../../components/init-project-form/init-project-form.component';
import { ProjectImportComponent } from '../../../../shared/components/project-import/project-import.component';

@Component({
  selector: 'app-init-project-view',
  standalone: true,
  imports: [InitProjectFormComponent, ProjectImportComponent],
  template: `
    <div class="py-4 px-40">
      <div class="flex flex-col gap-12">
        <app-project-import></app-project-import>
        <app-init-project-form></app-init-project-form>
      </div>
    </div>
  `
})
export class InitProjectViewComponent {}
