import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { By } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { GTMConfiguration, GtmImportSummary } from '@utils';
import { ProjectService } from '../../../shared/services/api/project-info/project-info.service';
import { SpecService } from '../../../shared/services/api/spec/spec.service';
import { UploadCardFacadeService } from '../../project/components/upload-card/upload-card-facade.service';
import { TagBuildImportSnackbarComponent } from '../components/tag-build-import-snackbar.component';
import { TagBuildViewComponent } from './tag-build-view.component';

const projectContainer = JSON.parse(
  JSON.stringify({
    exportFormatVersion: 2,
    exportTime: '2026-10-28 12:00:00',
    containerVersion: {
      tag: [{ name: 'GA4 event - login' }],
      trigger: [{ name: 'event equals login' }],
      variable: [{ name: 'DLV - method' }]
    }
  })
) as GTMConfiguration;

const summary = JSON.parse(
  JSON.stringify({
    saved: true,
    created: ['GA4 - login', 'GA4 - sign_up'],
    updated: ['GA4 - page_view'],
    unchanged: ['GA4 - view_item'],
    renamed: [],
    keptBoth: [
      { tagName: 'GA4 - old', testName: 'GA4 - old 2' },
      { tagName: 'GA4 - other', testName: 'GA4 - other 2' }
    ],
    skipped: [{ tagName: 'GA4 - paused', reason: 'paused.' }]
  })
) as GtmImportSummary;

const importedMessage =
  'Created 2 · Updated 1 · Renamed 0 · Kept both 2 · Unchanged 1 · Skipped 1';

describe('TagBuildViewComponent', () => {
  it.each([false, true])(
    'passes the project slug, container and import hook when the project has specs: %s',
    async (hasSpecs) => {
      const { page } = await render({ hasSpecs, container: projectContainer });

      expect(page.projectSlug()).toBe('demo-shop');
      expect(page.projectContainer()).toEqual(projectContainer);
      expect(page.projectImport()?.label).toBe('Import into this project');
    }
  );

  it('imports the built container and links the result to Tests', async () => {
    const { page, uploadCardFacade, snackBar } = await render({
      hasSpecs: true,
      container: projectContainer
    });
    uploadCardFacade.importContainerIntoProject.mockReturnValue(of(summary));
    const hook = page.projectImport();
    if (!hook) {
      throw new Error('expected the project import hook');
    }

    await expect(hook.run(projectContainer)).resolves.toBe(true);

    expect(uploadCardFacade.importContainerIntoProject).toHaveBeenCalledWith(
      'demo-shop',
      projectContainer
    );
    expect(snackBar.openFromComponent).toHaveBeenCalledWith(
      TagBuildImportSnackbarComponent,
      {
        duration: 10000,
        data: {
          message: importedMessage,
          testsLink: '/projects/demo-shop'
        }
      }
    );
  });

  it('passes no container when the project has not imported one', async () => {
    const { page } = await render({ hasSpecs: false, container: null });

    expect(page.projectContainer()).toBeNull();
    expect(page.projectImport()?.label).toBe('Import into this project');
  });

  it('reports nothing when the import is cancelled', async () => {
    const { page, uploadCardFacade, snackBar } = await render({
      hasSpecs: true,
      container: projectContainer
    });
    uploadCardFacade.importContainerIntoProject.mockReturnValue(of(null));
    const hook = page.projectImport();
    if (!hook) {
      throw new Error('expected the project import hook');
    }

    await expect(hook.run(projectContainer)).resolves.toBe(false);

    expect(snackBar.open).not.toHaveBeenCalled();
    expect(snackBar.openFromComponent).not.toHaveBeenCalled();
  });

  it('shows the reason an import failed and leaves the dialog open', async () => {
    const { page, uploadCardFacade, snackBar } = await render({
      hasSpecs: true,
      container: projectContainer
    });
    uploadCardFacade.importContainerIntoProject.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { message: 'containerVersion is missing.' }
          })
      )
    );
    const hook = page.projectImport();
    if (!hook) {
      throw new Error('expected the project import hook');
    }

    await expect(hook.run(projectContainer)).resolves.toBe(false);

    expect(snackBar.open).toHaveBeenCalledWith(
      'containerVersion is missing.',
      'Close'
    );
    expect(snackBar.openFromComponent).not.toHaveBeenCalled();
  });
});

async function render(options: {
  hasSpecs: boolean;
  container: GTMConfiguration | null;
}) {
  const uploadCardFacade = {
    importContainerIntoProject: vi.fn()
  };
  const snackBar = {
    open: vi.fn(),
    openFromComponent: vi.fn()
  };
  const { TagBuildPageComponent } = await import('@ui');
  await TestBed.configureTestingModule({
    imports: [TagBuildViewComponent],
    providers: [
      { provide: MatDialog, useValue: { open: vi.fn() } },
      {
        provide: ActivatedRoute,
        useValue: {
          parent: {
            parent: { snapshot: { params: { projectSlug: 'demo-shop' } } }
          }
        }
      },
      {
        provide: SpecService,
        useValue: {
          getProjectSpec: vi.fn(() =>
            of({ specs: options.hasSpecs ? [{ event: 'login' }] : [] })
          )
        }
      },
      {
        provide: ProjectService,
        useValue: {
          getProjectGtmConfig: vi.fn(() => of(options.container))
        }
      },
      { provide: UploadCardFacadeService, useValue: uploadCardFacade },
      { provide: MatSnackBar, useValue: snackBar }
    ]
  })
    .overrideComponent(TagBuildPageComponent, {
      set: { imports: [], template: '' }
    })
    .compileComponents();
  const fixture = TestBed.createComponent(TagBuildViewComponent);
  fixture.detectChanges();
  await fixture.componentInstance.tagBuildPageComponent;
  await fixture.whenStable();
  fixture.detectChanges();
  const page = fixture.debugElement
    .query(By.directive(TagBuildPageComponent))
    .injector.get(TagBuildPageComponent);
  return { fixture, page, uploadCardFacade, snackBar };
}
