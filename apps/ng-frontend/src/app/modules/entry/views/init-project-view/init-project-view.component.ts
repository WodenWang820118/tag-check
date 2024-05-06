import { Component, OnDestroy, OnInit } from '@angular/core';
import { InitProjectFormComponent } from '../../components/init-project-form/init-project-form.component';
import { FormBuilder, Validators } from '@angular/forms';
import { ConfigurationService } from '../../../../shared/services/api/configuration/configuration.service';
import { Subject, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'app-init-project-view',
  standalone: true,
  imports: [InitProjectFormComponent],
  templateUrl: `./init-project-view.component.html`,
  styles: `
    .init-project {
      padding: 1rem 10rem;
      &__config {
        display: flex;
        flex-direction: column;
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
