import { AsyncPipe, NgComponentOutlet, NgIf } from '@angular/common';
import { Component, computed, OnDestroy, OnInit, signal } from '@angular/core';
import { Subject, takeUntil, tap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Spec } from '@utils';
import { SpecService } from '../../../shared/services/api/spec/spec.service';

@Component({
  selector: 'app-tag-build-view',
  standalone: true,
  imports: [AsyncPipe, NgIf, AsyncPipe, NgComponentOutlet],
  template: `
    <ng-container
      *ngIf="tagBuildPageComponent | async as tagBuildPageComponent"
    >
      <ng-container
        *ngComponentOutlet="
          tagBuildPageComponent;
          inputs: { specs: projectSpecSignal$() }
        "
      ></ng-container>
    </ng-container>
  `,
  styles: [``]
})
export class TagBuildViewComponent implements OnInit, OnDestroy {
  tagBuildPageComponent = this.loadTagBuildPageComponent();
  projectSpecSignal = signal([] as Spec[]);
  projectSpecSignal$ = computed(() => this.projectSpecSignal());
  destroy$ = new Subject<void>();

  constructor(
    private specService: SpecService,
    private route: ActivatedRoute
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
          this.projectSpecSignal.set(data.specs);
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
