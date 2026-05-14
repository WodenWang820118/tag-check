import { ComponentType } from '@angular/cdk/portal';
import { DestroyRef, inject, Injectable } from '@angular/core';
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
import { InstantErrorStateMatcher } from './helper';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import slug from 'slug';

@Injectable({
  providedIn: 'root'
})
export class InitProjectFormFacadeService {
  private readonly fb = inject(FormBuilder);
  private readonly projectService = inject(ProjectService);
  private readonly configurationService = inject(ConfigurationService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  // #region form state
  errorDialogComponent: Promise<ComponentType<unknown> | null> =
    this.loadErrorDialogComponent();
  validProjectNameMatcher = new InstantErrorStateMatcher();
  allowedSymbolsPattern = /^[a-zA-Z0-9-!'",\s]+$/;
  private hasProjectNameObserver = false;
  private readonly slugOptions: slug.Options = {
    lower: true,
    locale: 'en',
    replacement: '-',
    remove: /[*+~.()'"!:@]/g,
    trim: true
  };

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
  // #endregion

  constructor() {
    this.observeProjectNameChanges();
  }

  private async loadErrorDialogComponent(): Promise<ComponentType<unknown> | null> {
    try {
      const module = await import('@ui');
      return module.ErrorDialogComponent as ComponentType<unknown>;
    } catch (error) {
      console.error('Failed to load toolbar component:', error);
      return null;
    }
  }

  // #region project name behavior
  observeProjectNameChanges(): void {
    if (this.hasProjectNameObserver) {
      return;
    }

    this.hasProjectNameObserver = true;

    this.projectForm.controls.projectName.valueChanges
      .pipe(
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
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
    return slug(value, this.slugOptions);
  }
  // #endregion

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

  private async showErrorDialog(message: string): Promise<void> {
    const errorComponent = await this.errorDialogComponent;
    if (errorComponent !== null) {
      this.dialog.open(errorComponent, {
        data: {
          message: message
        }
      });
    }
  }

  private isEmptyObject(obj: unknown): obj is Record<string, never> {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      !Array.isArray(obj) &&
      Object.keys(obj).length === 0
    );
  }
}
