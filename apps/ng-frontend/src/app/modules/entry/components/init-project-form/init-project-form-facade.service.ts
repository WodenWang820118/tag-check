import { ComponentType } from '@angular/cdk/portal';
import {
  DestroyRef,
  inject,
  Injectable,
  Injector,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfigurationService } from '../../../../shared/services/api/configuration/configuration.service';
import { ProjectService } from '../../../../shared/services/api/project-info/project-info.service';
import {
  catchError,
  distinctUntilChanged,
  EMPTY,
  firstValueFrom,
  tap
} from 'rxjs';
import { InstantErrorStateMatcher } from './helper';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { form, readonly, required, validate } from '@angular/forms/signals';
import slug from 'slug';

export interface ProjectFormModel {
  projectName: string;
  projectSlug: string;
  measurementId: string;
  projectDescription: string;
}

/**
 * The new project form: suggests a slug from the project name, creates
 * the project once a root project path is configured, then opens it.
 */
@Injectable({
  providedIn: 'root'
})
export class InitProjectFormFacadeService {
  private readonly projectService = inject(ProjectService);
  private readonly configurationService = inject(ConfigurationService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

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

  readonly projectModel = signal<ProjectFormModel>({
    projectName: '',
    projectSlug: '',
    measurementId: '',
    projectDescription: ''
  });

  readonly projectForm = form(this.projectModel, (p) => {
    required(p.projectName);
    validate(p.projectName, ({ value }) => {
      const v = value();
      if (!v) {
        return undefined;
      }
      return this.allowedSymbolsPattern.test(v)
        ? undefined
        : { kind: 'invalidCharacters' };
    });
    required(p.projectSlug);
    readonly(p.projectSlug);
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

    toObservable(this.projectForm.projectName().value, {
      injector: this.injector
    })
      .pipe(
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
        tap((value) => {
          if (!value) {
            this.reset();
            return;
          }
          const formattedValue = this.formatProjectSlug(value);
          const fourRandomChars = Math.random().toString(36).substring(2, 6);
          this.projectForm
            .projectSlug()
            .value.set(formattedValue + '-' + fourRandomChars);
        }),
        catchError((error) => {
          console.error('Error observing project name changes:', error);
          return EMPTY;
        })
      )
      .subscribe();
  }

  reset(): void {
    this.projectModel.set({
      projectName: '',
      projectSlug: '',
      measurementId: '',
      projectDescription: ''
    });
  }

  private formatProjectSlug(value: string): string {
    return slug(value, this.slugOptions);
  }
  // #endregion

  async submitProject(): Promise<void> {
    if (!this.projectForm().valid()) {
      await this.showErrorDialog('Please fill in the required fields.');
      return;
    }

    try {
      const rootProjectPath = await firstValueFrom(
        this.configurationService.getConfiguration('rootProjectPath')
      );
      if (!rootProjectPath || this.isEmptyObject(rootProjectPath)) {
        await this.showErrorDialog('Please configure the root path first.');
        return;
      }

      const data = await firstValueFrom(
        this.projectService.initProject(this.projectModel())
      );
      // ProjectService logs a failed request and answers null.
      if (!data) {
        await this.showErrorDialog(
          'Could not create the project. Please try again.'
        );
        return;
      }
      await this.router.navigate(['/', 'projects', data.projectSlug]);
      this.reset();
    } catch (error) {
      console.error('Error initializing project:', error);
    }
  }

  private async showErrorDialog(message: string): Promise<void> {
    const errorComponent = await this.errorDialogComponent;
    if (errorComponent !== null) {
      this.dialog.open(errorComponent, {
        data: {
          message
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
