import { Component, OnDestroy, OnInit } from '@angular/core';
import { InitProjectFormComponent } from '../../components/init-project-form/init-project-form.component';
import { FormBuilder, Validators } from '@angular/forms';
import { ConfigurationService } from '../../../../shared/services/api/configuration/configuration.service';
import { Subject, takeUntil, tap } from 'rxjs';
import { ProjectImportComponent } from '../../../../shared/components/project-import/project-import.component';

@Component({
  selector: 'app-init-project-view',
  standalone: true,
  imports: [InitProjectFormComponent, ProjectImportComponent],
  template: `
    <div class="init-project">
      <div class="init-project__form">
        <app-project-import></app-project-import>
        <app-init-project-form></app-init-project-form>
      </div>
    </div>
  `,
  styles: `
    .init-project {
      padding: 1rem 10rem;
      &__form {
        display: flex;
        flex-direction: column;
        gap: 3rem;
      }
    }
  `,
})
export class InitProjectViewComponent implements OnInit, OnDestroy {
  configurationForm = this.fb.group({
    root: ['', Validators.required],
  });
  isRoot = false;
  destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private configurationService: ConfigurationService
  ) {}

  ngOnInit() {
    // TODO: could be removed since the business logic is not here anymore
    this.configurationService
      .getConfiguration('rootProjectPath')
      .pipe(
        takeUntil(this.destroy$),
        tap((rootProjectPath) => {
          console.log('root', rootProjectPath);
          if (rootProjectPath && !this.isEmptyObject(rootProjectPath)) {
            this.isRoot = true;
          }
        })
      )
      .subscribe();
  }

  isEmptyObject(obj: any) {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
