import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import {
  ReactiveFormsModule,
  FormsModule,
  FormGroup,
  FormBuilder,
  Validators,
} from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';
import { ProjectService } from '../../services/api/project/project.service';
import { ConfigurationService } from '../../services/api/configuration/configuration.service';
import { switchMap, take } from 'rxjs';

@Component({
  selector: 'app-init-project-form',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    RouterModule,
  ],
  template: `
    <div class="init-project-form">
      <form #f="ngForm" [formGroup]="projectForm" (ngSubmit)="onSubmit()">
        <mat-card>
          <mat-card-header>
            <mat-card-title>New Project</mat-card-title>
            <mat-card-subtitle
              >Please fill in the required information</mat-card-subtitle
            >
          </mat-card-header>
          <br />
          <mat-card-content>
            <div style="display: flex; flex-direction: column; gap: 1rem">
              <mat-form-field>
                <mat-label>Project Name</mat-label>
                <input
                  matInput
                  placeholder="Corporate Website Project"
                  formControlName="projectName"
                />
              </mat-form-field>
              <mat-form-field>
                <mat-label>Project Slug</mat-label>
                <input
                  matInput
                  placeholder="unique-slug-1234"
                  formControlName="projectSlug"
                />
              </mat-form-field>
              <mat-form-field>
                <mat-label>Project Description</mat-label>
                <input matInput formControlName="projectDescription" />
              </mat-form-field>
              <mat-form-field>
                <mat-label>Choose The Project Type</mat-label>
                <mat-select formControlName="testType">
                  <mat-option value="Tag Verifier">Tag Verifier</mat-option>
                  <mat-option value="Data Layer Checker"
                    >Data Layer Checker</mat-option
                  >
                </mat-select>
              </mat-form-field>
              <mat-form-field>
                <mat-label>Google Spreadsheet Link</mat-label>
                <input matInput formControlName="googleSpreadsheetLink" />
              </mat-form-field>
            </div>
          </mat-card-content>

          <mat-card-actions align="end">
            <button mat-button [routerLink]="['/']">Cancel</button>
            <button mat-button>Submit</button>
          </mat-card-actions>
        </mat-card>
      </form>
    </div>
  `,
  styles: ``,
})
export class InitProjectFormComponent {
  projectForm: FormGroup;
  testType = ['Tag-Verifier', 'Data layer checker'];
  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private router: Router,
    private configService: ConfigurationService
  ) {
    this.projectForm = this.fb.group({
      projectName: ['', Validators.required],
      projectSlug: ['', Validators.required],
      projectDescription: [''],
      testType: ['', Validators.required],
      googleSpreadsheetLink: [''],
    });
  }

  onSubmit() {
    // TODO: Use switchMap to switch to the new project
    this.configService
      .getConfiguration('rootProjectPath')
      .pipe(
        take(1),
        switchMap((rootProject) => {
          this.router.navigate([
            '/projects',
            this.projectForm.value['projectSlug'],
          ]);
          return this.projectService.initProject(
            rootProject.value,
            this.projectForm.value
          );
        })
      )
      .subscribe();
  }
}
