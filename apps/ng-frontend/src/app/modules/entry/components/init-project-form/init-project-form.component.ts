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
import { ProjectInfoService } from '../../../../shared/services/api/project-info/project-info.service';
import { ConfigurationService } from '../../../../shared/services/api/configuration/configuration.service';
import { EMPTY, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { ErrorDialogComponent } from '../../../../shared/components/error-dialog/error-dialog.component';
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
    private projectInfoService: ProjectInfoService,
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
            return EMPTY;
          } else {
            return rootProjectPath;
          }
        }),
        switchMap((rootProjectPath) => {
          if (!rootProjectPath || this.isEmptyObject(rootProjectPath)) {
            this.dialog.open(ErrorDialogComponent, {
              data: {
                message: 'Please configure the root path first.',
              },
            });
            // Throw an error or return EMPTY to stop the observable chain if configuration is not valid
            return EMPTY;
          } else {
            return this.projectInfoService.initProject(
              rootProjectPath.value,
              this.projectForm.value
            );
          }
        })
      )
      .subscribe({
        next: () => {
          this.router.navigate([
            '/projects',
            this.projectForm.value['projectSlug'],
          ]);
        },
        error: (error) => {
          // Handle any errors here
          console.error('Error initializing project:', error);
        },
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
