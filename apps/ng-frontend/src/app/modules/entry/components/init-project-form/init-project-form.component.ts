import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
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
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { ProjectInfoService } from '../../../../shared/services/api/project-info/project-info.service';
import { ConfigurationService } from '../../../../shared/services/api/configuration/configuration.service';
import {
  catchError,
  EMPTY,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs';
import { ErrorDialogComponent } from '../../../../shared/components/error-dialog/error-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { InstantErrorStateMatcher } from './helper';

@Component({
  selector: 'app-init-project-form',
  standalone: true,
  imports: [
    NgIf,
    MatCardModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    RouterLink,
    ErrorDialogComponent,
  ],
  templateUrl: `./init-project-form.component.html`,
  styles: ``,
})
export class InitProjectFormComponent implements OnInit, OnDestroy {
  projectForm: FormGroup;
  allowedSymbolsPattern = /^[a-zA-Z0-9-!'",\s]+$/;
  validProjectNameMatcher: InstantErrorStateMatcher;

  destroy$ = new Subject<void>();
  constructor(
    private fb: FormBuilder,
    private projectInfoService: ProjectInfoService,
    private router: Router,
    private configurationService: ConfigurationService,
    private dialog: MatDialog
  ) {
    this.validProjectNameMatcher = new InstantErrorStateMatcher();
    this.projectForm = this.fb.group({
      projectName: [
        '',
        [
          Validators.required,
          this.validProjectNameMatcher.allowedCharactersValidator(
            this.allowedSymbolsPattern
          ),
        ],
      ],
      projectSlug: [''],
      measurementId: [''],
      projectDescription: [''],
      googleSpreadsheetLink: [''],
    });
  }

  ngOnInit(): void {
    this.observeProjectNameChanges();
  }

  observeProjectNameChanges() {
    this.projectForm.controls['projectName'].valueChanges
      .pipe(
        takeUntil(this.destroy$),
        tap((value) => {
          const formattedValue = value
            // Replace allowed symbols with a dash
            .replace(/[-!'",\s]/g, '-')
            // Remove all characters that are not dashes, numbers, or lowercase letters
            .replace(/[^a-z0-9-]/gi, '')
            // Convert to lowercase
            .toLowerCase()
            // Replace consecutive dashes with a single dash
            .replace(/--+/g, '-');
          // the random string is added to the end of the project slug to avoid conflicts
          const fourRandomChars = Math.random().toString(36).substring(2, 6);

          this.projectForm.controls['projectSlug'].setValue(
            formattedValue + '-' + fourRandomChars
          );
        }),
        catchError((error) => {
          console.error('Error observing project name changes:', error);
          return EMPTY;
        })
      )
      .subscribe();
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
        take(1),
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
            console.log('project form value: ', this.projectForm.value);
            console.log(
              'project slug: ',
              this.projectForm.value['projectSlug']
            );
            return this.projectInfoService.initProject(
              rootProjectPath.value,
              this.projectForm.value
            );
          }
        }),
        catchError((error) => {
          console.error('Error initializing project:', error);
          return EMPTY;
        })
      )
      .subscribe({
        next: () => {
          this.router.navigate([
            '/projects',
            this.projectForm.value['projectSlug'],
          ]);
        },
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
