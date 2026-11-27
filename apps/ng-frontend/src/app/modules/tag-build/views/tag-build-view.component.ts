import { AsyncPipe, NgComponentOutlet } from '@angular/common';
import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import type { ProjectContainerImport } from '@ui';
import { GTMConfiguration, GtmImportSummary } from '@utils';
import { firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectService } from '../../../shared/services/api/project-info/project-info.service';
import {
  gtmImportErrorMessage,
  UploadCardFacadeService
} from '../../project/components/upload-card/upload-card-facade.service';
import { TagBuildImportSnackbarComponent } from '../components/tag-build-import-snackbar.component';

/**
 * The TagBuild page: opens @ui's TagBuildPageComponent, imported lazily,
 * with empty specs. It passes the project's saved container and an import
 * hook, which the standalone tag-build site does not set.
 */
@Component({
  selector: 'app-tag-build-view',
  standalone: true,
  imports: [AsyncPipe, NgComponentOutlet],
  template: `
    @if (tagBuildPageComponent | async; as tagBuildPageComponent) {
      <ng-container
        [ngComponentOutlet]="tagBuildPageComponent"
        [ngComponentOutletInputs]="{
          specs: [],
          projectSlug: projectSlug,
          projectImport: projectImport,
          projectContainer: projectContainer()
        }"
      ></ng-container>
    }
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [``]
})
export class TagBuildViewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly projectService = inject(ProjectService);
  private readonly uploadCardFacade = inject(UploadCardFacadeService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly tagBuildPageComponent = this.loadTagBuildPageComponent();
  /** Saved container from `GET projects/:slug/gtm-config`, or null. */
  readonly projectContainer = signal<GTMConfiguration | null>(null);
  /**
   * Import hook for the shared page. Set once the project slug is known.
   * The page reads it when the success dialog opens.
   */
  projectImport: ProjectContainerImport | null = null;
  projectSlug?: string;

  ngOnInit() {
    const projectSlugParam: unknown =
      this.route.parent?.parent?.snapshot?.params?.['projectSlug'];
    const slug =
      typeof projectSlugParam === 'string' ? projectSlugParam : undefined;
    this.projectSlug = slug;
    if (!slug) return;
    this.projectImport = {
      label: 'Import into this project',
      run: (container) => this.importBuiltContainer(slug, container)
    };
    this.projectService
      .getProjectGtmConfig(slug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((container) => {
        this.projectContainer.set(container);
      });
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

  /**
   * Runs the same preview, conflict dialog and upload as Import GTM JSON.
   * True when the container was imported. False when the user cancels or
   * the import fails; the success dialog stays open in those cases.
   */
  private async importBuiltContainer(
    projectSlug: string,
    container: GTMConfiguration
  ): Promise<boolean> {
    try {
      const summary = await firstValueFrom(
        this.uploadCardFacade.importContainerIntoProject(projectSlug, container)
      );
      if (!summary) {
        return false;
      }
      this.showImportResult(projectSlug, summary);
      return true;
    } catch (error: unknown) {
      this.snackBar.open(gtmImportErrorMessage(error), 'Close');
      return false;
    }
  }

  private showImportResult(
    projectSlug: string,
    summary: GtmImportSummary
  ): void {
    // Long enough to read six counts and reach the Tests link, then it goes.
    this.snackBar.openFromComponent(TagBuildImportSnackbarComponent, {
      duration: 10000,
      data: {
        message: importSummaryMessage(summary),
        testsLink: `/projects/${projectSlug}`
      }
    });
  }
}

/** The six import counts, in the order the import summary lists them. */
function importSummaryMessage(summary: GtmImportSummary): string {
  return [
    `Created ${summary.created.length}`,
    `Updated ${summary.updated.length}`,
    `Renamed ${summary.renamed.length}`,
    `Kept both ${summary.keptBoth.length}`,
    `Unchanged ${summary.unchanged.length}`,
    `Skipped ${summary.skipped.length}`
  ].join(' · ');
}
