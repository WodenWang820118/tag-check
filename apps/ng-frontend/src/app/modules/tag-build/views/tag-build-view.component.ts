import { AsyncPipe, NgComponentOutlet } from '@angular/common';
import { Component, computed, OnDestroy, OnInit, signal } from '@angular/core';
import { Subject, takeUntil, tap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Spec } from '@utils';
import { SpecService } from '../../../shared/services/api/spec/spec.service';

@Component({
  selector: 'app-tag-build-view',
  standalone: true,
  imports: [AsyncPipe, NgComponentOutlet],
  template: `
    @if (tagBuildPageComponent | async; as tagBuildPageComponent) {
      @if (projectSpecSignal$().length > 0) {
        <ng-container
          [ngComponentOutlet]="tagBuildPageComponent"
          [ngComponentOutletInputs]="{ specs: projectSpecSignal$() }"
        ></ng-container>
      } @else {
        <ng-container
          [ngComponentOutlet]="tagBuildPageComponent"
          [ngComponentOutletInputs]="{ specs: [] }"
        ></ng-container>
      }
    }
  `,
  styles: [``]
})
export class TagBuildViewComponent implements OnInit, OnDestroy {
  tagBuildPageComponent = this.loadTagBuildPageComponent();
  projectSpecSignal = signal([] as Spec[]);
  projectSpecSignal$ = computed(() => this.projectSpecSignal());
  destroy$ = new Subject<void>();

  constructor(
    private readonly specService: SpecService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit() {
    const projectSlug =
      this.route.parent?.parent?.snapshot.params['projectSlug'];
    if (!projectSlug) return;
    this.specService
      .getProjectSpec(projectSlug)
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
