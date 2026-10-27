import { AsyncPipe, NgComponentOutlet } from '@angular/common';
import {
  Component,
  computed,
  OnDestroy,
  OnInit,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { Subject, takeUntil, tap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { StrictDataLayerEvent } from '@utils';
import { SpecService } from '../../../shared/services/api/spec/spec.service';

/**
 * The TagBuild page: loads the project's specs into @ui's
 * TagBuildPageComponent, imported lazily.
 */
@Component({
  selector: 'app-tag-build-view',
  standalone: true,
  imports: [AsyncPipe, NgComponentOutlet],
  template: `
    @if (tagBuildPageComponent | async; as tagBuildPageComponent) {
      @if (projectSpecSignal$().length > 0) {
        <ng-container
          [ngComponentOutlet]="tagBuildPageComponent"
          [ngComponentOutletInputs]="{
            specs: projectSpecSignal$(),
            projectSlug: projectSlug
          }"
        ></ng-container>
      } @else {
        <ng-container
          [ngComponentOutlet]="tagBuildPageComponent"
          [ngComponentOutletInputs]="{ specs: [], projectSlug: projectSlug }"
        ></ng-container>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [``]
})
export class TagBuildViewComponent implements OnInit, OnDestroy {
  tagBuildPageComponent = this.loadTagBuildPageComponent();
  projectSpecSignal = signal([] as StrictDataLayerEvent[]);
  projectSpecSignal$ = computed(() => this.projectSpecSignal());
  destroy$ = new Subject<void>();
  projectSlug?: string;

  constructor(
    private readonly specService: SpecService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit() {
    const projectSlug: unknown =
      this.route.parent?.parent?.snapshot.params['projectSlug'];
    this.projectSlug =
      typeof projectSlug === 'string' ? projectSlug : undefined;
    if (!this.projectSlug) return;
    this.specService
      .getProjectSpec(this.projectSlug)
      .pipe(
        takeUntil(this.destroy$),
        tap((data) => {
          if (data.specs.length > 0) {
            this.projectSpecSignal.set(data.specs);
          }
        })
      )
      .subscribe();
  }

  private async loadTagBuildPageComponent() {
    try {
      const module = await import('@ui');
      return module.TagBuildPageComponent;
    } catch (error) {
      console.error('Failed to load toolbar component:', error);
      return null;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
