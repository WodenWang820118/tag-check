import { Component, OnDestroy } from '@angular/core';
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
import { Subject, takeUntil, tap } from 'rxjs';
import { ErrorDialogComponent } from '../error-dialog/error-dialog.component';
import { MatDialog } from '@angular/material/dialog';

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
    ErrorDialogComponent,
  ],
  templateUrl: `./init-project-form.component.html`,
  styles: ``,
})
export class InitProjectFormComponent implements OnDestroy {
  projectForm: FormGroup;
  testType = ['Tag-Verifier', 'Data layer checker'];
  destroy$ = new Subject<void>();
  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private router: Router,
    private configurationService: ConfigurationService,
    private dialog: MatDialog
  ) {
    this.projectForm = this.fb.group({
      projectName: ['', Validators.required],
      projectSlug: ['', Validators.required],
      projectDescription: [''],
      testType: ['', Validators.required],
      googleSpreadsheetLink: [''],
    });
  }

  isEmptyObject(obj: any) {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
  }

  onSubmit() {
    if (this.projectForm.invalid) {
      this.dialog.open(ErrorDialogComponent, {
        data: {
          message: 'Please fill in the required fields.',
        },
      });
      return;
    }
    this.configurationService
      .getConfiguration('rootProjectPath')
      .pipe(
        takeUntil(this.destroy$),
        tap((rootProjectPath) => {
          if (!rootProjectPath || this.isEmptyObject(rootProjectPath)) {
            this.dialog.open(ErrorDialogComponent, {
              data: {
                message: 'Please configure the root path first.',
              },
            });
            return;
          }

          this.router.navigate([
            '/projects',
            this.projectForm.value['projectSlug'],
          ]);

          this.projectService.initProject(
            rootProjectPath.value,
            this.projectForm.value
          );
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
