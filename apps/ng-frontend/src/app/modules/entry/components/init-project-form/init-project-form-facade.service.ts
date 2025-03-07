import { DestroyRef, Injectable } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ConfigurationService } from '../../../../shared/services/api/configuration/configuration.service';
import { ProjectService } from '../../../../shared/services/api/project-info/project-info.service';
import {
  catchError,
  distinctUntilChanged,
  EMPTY,
  switchMap,
  take,
  tap
} from 'rxjs';
import { ErrorDialogComponent } from '@ui';
import { InstantErrorStateMatcher } from './helper';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import slugify from 'slugify';
@Injectable({
  providedIn: 'root'
})
export class InitProjectFormFacadeService {
  validProjectNameMatcher = new InstantErrorStateMatcher();
  allowedSymbolsPattern = /^[a-zA-Z0-9-!'",\s]+$/;
  projectForm: FormGroup<{
    projectName: FormControl<string>;
    projectSlug: FormControl<string>;
    measurementId: FormControl<string>;
    projectDescription: FormControl<string>;
  }> = this.fb.nonNullable.group({
    projectName: [
      '',
      {
        validators: [
          Validators.required,
          this.validProjectNameMatcher.allowedCharactersValidator(
            this.allowedSymbolsPattern
          )
        ]
      }
    ],
    projectSlug: ['', Validators.required],
    measurementId: '',
    projectDescription: ''
  });

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private configurationService: ConfigurationService,
    private dialog: MatDialog,
    private destoryRef: DestroyRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.observeProjectNameChanges();
  }

  observeProjectNameChanges(): void {
    this.projectForm.controls.projectName.valueChanges
      .pipe(
        distinctUntilChanged(),
        takeUntilDestroyed(this.destoryRef),
        tap((value) => {
          if (!value) {
            this.projectForm.reset();
            return;
          }
          const formattedValue = this.formatProjectSlug(value);
          const fourRandomChars = Math.random().toString(36).substring(2, 6);
          this.projectForm.controls.projectSlug.setValue(
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

  private formatProjectSlug(value: string): string {
    // Use slugify to handle non-English characters
    return slugify(value, {
      lower: true, // Convert to lowercase
      strict: true, // Strip special characters except replacement
      locale: 'en', // Language for transliteration rules
      replacement: '-', // Replace spaces with hyphens
      remove: /[*+~.()'"!:@]/g, // Remove these chars
      trim: true // Trim leading and trailing replacement chars
    });
  }

  submitProject() {
    if (this.projectForm.invalid) {
      this.showErrorDialog('Please fill in the required fields.');
      return EMPTY;
    }

    return this.configurationService.getConfiguration('rootProjectPath').pipe(
      take(1),
      switchMap((rootProjectPath) => {
        if (!rootProjectPath || this.isEmptyObject(rootProjectPath)) {
          this.showErrorDialog('Please configure the root path first.');
          return EMPTY;
        }

        return this.projectService
          .initProject(this.projectForm.getRawValue())
          .pipe(
            tap((data) => {
              if (data) {
                this.router
                  .navigate(['/', 'projects', data.projectSlug])
                  .then(() => {
                    this.projectForm.reset();
                  });
              }
            })
          );
      }),
      catchError((error) => {
        console.error('Error initializing project:', error);
        return EMPTY;
      })
    );
  }

  private showErrorDialog(message: string): void {
    this.dialog.open(ErrorDialogComponent, {
      data: { message }
    });
  }

  private isEmptyObject(obj: any): boolean {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
  }
}
