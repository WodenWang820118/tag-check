import { DestroyRef, Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ConfigurationService } from '../../../../shared/services/api/configuration/configuration.service';
import { ProjectService } from '../../../../shared/services/api/project-info/project-info.service';
import { catchError, EMPTY, switchMap, take, tap } from 'rxjs';
import { ErrorDialogComponent } from '@ui';
import { InstantErrorStateMatcher } from './helper';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class InitProjectFormFacadeService {
  validProjectNameMatcher = new InstantErrorStateMatcher();
  allowedSymbolsPattern = /^[a-zA-Z0-9-!'",\s]+$/;
  projectForm: FormGroup = this.fb.group({
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
    projectSlug: [''],
    measurementId: [''],
    projectDescription: ['']
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
    this.projectForm.controls['projectName'].valueChanges
      .pipe(
        takeUntilDestroyed(this.destoryRef),
        tap((value) => {
          if (!value) {
            this.projectForm.reset();
            return;
          }
          const formattedValue = this.formatProjectSlug(value);
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

  private formatProjectSlug(value: string): string {
    return value
      .replace(/[-!'",\s]/g, '-')
      .replace(/[^a-z0-9-]/gi, '')
      .toLowerCase()
      .replace(/--+/g, '-');
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

        return this.projectService.initProject(this.projectForm.value).pipe(
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
