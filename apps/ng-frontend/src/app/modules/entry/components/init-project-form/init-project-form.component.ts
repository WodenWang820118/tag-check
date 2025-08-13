import { InitProjectFormFacadeService } from './init-project-form-facade.service';
import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-init-project-form',
  standalone: true,
  imports: [
    MatCardModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    RouterLink
  ],
  templateUrl: `./init-project-form.component.html`,
  styleUrls: ['./init-project-form.component.scss']
})
export class InitProjectFormComponent implements OnInit {
  constructor(
    private readonly initProjectFormFacadeService: InitProjectFormFacadeService
  ) {}

  ngOnInit(): void {
    this.initProjectFormFacadeService.observeProjectNameChanges();
  }

  onSubmit() {
    this.initProjectFormFacadeService.submitProject().subscribe();
  }

  get form() {
    return this.initProjectFormFacadeService.projectForm;
  }

  get validProjectNameMatcher() {
    return this.initProjectFormFacadeService.validProjectNameMatcher;
  }
}
