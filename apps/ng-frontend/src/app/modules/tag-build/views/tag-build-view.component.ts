import { AsyncPipe } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import {
  catchError,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';
import { TagBuildPageComponent } from '@ui';
import { ActivatedRoute } from '@angular/router';
import { ProjectSpec } from '@utils';
import { SpecService } from '../../../shared/services/api/spec/spec.service';

@Component({
  selector: 'app-tag-build-view',
  standalone: true,
  imports: [AsyncPipe, TagBuildPageComponent],
  template: `<lib-tag-build-page
    [projectSpecs]="projectSpec$ | async"
  ></lib-tag-build-page>`,
  styles: [``],
})
export class TagBuildViewComponent implements OnDestroy {
  projectSpec$!: Observable<ProjectSpec | null>;
  destroy$ = new Subject<void>();

  constructor(private specService: SpecService, private route: ActivatedRoute) {
    // TODO: may need to refactor due to using parent.parent
    // could be a way to get the projectSlug from somewhere else
    this.projectSpec$ = (
      this.route.parent?.parent?.params ??
      of({
        projectSlug: '',
      } as any)
    ).pipe(
      takeUntil(this.destroy$),
      switchMap((params) => {
        const projectSlug = params['projectSlug'] || '';
        return this.specService.getProjectSpec(projectSlug);
      }),
      catchError((err) => {
        console.error(err);
        return of(null);
      })
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
