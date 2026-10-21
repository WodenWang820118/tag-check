import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, expect, it, vi } from 'vitest';
import { MatTooltip } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { ProjectDataSourceService } from '../../../../shared/services/data-source/project-data-source.service';
import { TestRunningFacadeService } from '../../../../shared/services/facade/test-running-facade.service';
import { UploadSpecService } from '../../../../shared/services/upload-spec/upload-spec.service';
import { ReportTableDataSourceModelService } from '../../services/report-table-data-source-model/report-table-data-source-model.service';
import { ReportTableToolbarComponent } from './report-table-toolbar.component';

describe('ReportTableToolbarComponent', () => {
  async function renderToolbar(): Promise<
    ComponentFixture<ReportTableToolbarComponent>
  > {
    TestBed.configureTestingModule({
      imports: [ReportTableToolbarComponent],
      providers: [
        provideNoopAnimations(),
        {
          provide: ProjectDataSourceService,
          useValue: {
            getFilterSignal: vi.fn(),
            setFilterSignal: vi.fn(),
            setDeletedSignal: vi.fn(),
            getPreventNavigationSignal: vi.fn().mockReturnValue(false),
            setPreventNavigationSignal: vi.fn()
          }
        },
        {
          provide: TestRunningFacadeService,
          useValue: {
            isRunningTest$: vi.fn().mockReturnValue(false),
            stopOperation: vi.fn().mockReturnValue(of(null))
          }
        },
        {
          provide: UploadSpecService,
          useValue: {
            startUpload: vi.fn()
          }
        },
        {
          provide: ReportTableDataSourceModelService,
          useValue: {
            selection: vi.fn().mockReturnValue({
              hasValue: vi.fn().mockReturnValue(true)
            })
          }
        }
      ]
    });
    const fixture = TestBed.createComponent(ReportTableToolbarComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('renders bookmark button with updated aria-label and matTooltip', async () => {
    const fixture = await renderToolbar();
    const buttonDe = fixture.debugElement.query(
      By.css('[data-testid="tests-prevent-navigation"]')
    );
    expect(buttonDe).not.toBeNull();

    const element = buttonDe.nativeElement as HTMLButtonElement;
    expect(element.getAttribute('aria-label')).toBe(
      'Bookmark: block default navigation on the last click'
    );

    const tooltip = buttonDe.injector.get(MatTooltip);
    expect(tooltip.message).toBe(
      "Bookmark: on the last click, block the browser's default link and form navigation (single-page app routing still runs)"
    );
  });
});
