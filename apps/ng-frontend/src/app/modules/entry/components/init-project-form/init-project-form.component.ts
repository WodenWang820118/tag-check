import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { FieldTree, FormField } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { InitProjectFormFacadeService } from './init-project-form-facade.service';

@Component({
  selector: 'app-init-project-form',
  standalone: true,
  imports: [
    MatCardModule,
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    RouterLink
  ],
  templateUrl: './init-project-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./init-project-form.component.scss']
})
export class InitProjectFormComponent {
  private readonly initProjectFormFacadeService = inject(
    InitProjectFormFacadeService
  );

  async onSubmit(): Promise<void> {
    await this.initProjectFormFacadeService.submitProject();
  }

  get form() {
    return this.initProjectFormFacadeService.projectForm;
  }

  hasError(field: FieldTree<unknown>, kind: string): boolean {
    return field()
      .errors()
      .some((error) => error.kind === kind);
  }
}
