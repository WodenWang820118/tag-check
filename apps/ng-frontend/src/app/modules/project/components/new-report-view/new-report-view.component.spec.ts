import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { EditorService } from '../../../../shared/services/editor/editor.service';
import { NewReportViewFacadeService } from './new-report-view-facade.service';
import { NewReportViewComponent } from './new-report-view.component';

function render(routeData: Record<string, unknown>) {
  const router = {
    url: '/projects/demo',
    navigated: true,
    navigate: vi.fn().mockResolvedValue(true)
  };
  const facade = {
    uploadReport: vi.fn(() => of({})),
    completeUpload: vi.fn()
  };
  const sidenav = { close: vi.fn().mockResolvedValue('close') };
  TestBed.configureTestingModule({
    imports: [NewReportViewComponent],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          data: of({ projectSlug: 'demo' }),
          snapshot: { data: routeData }
        }
      },
      { provide: Router, useValue: router },
      { provide: NewReportViewFacadeService, useValue: facade },
      {
        provide: EditorService,
        useValue: { jsonSyntaxError$: { specJson: signal(false) } }
      }
    ]
  });
  TestBed.overrideComponent(NewReportViewComponent, {
    set: { template: '', imports: [] }
  });
  const fixture = TestBed.createComponent(NewReportViewComponent);
  fixture.componentRef.setInput('sidenav', sidenav as unknown as MatSidenav);
  return { component: fixture.componentInstance, router, facade, sidenav };
}

describe('NewReportViewComponent.uploadReport', () => {
  it('reloads the tests page and closes the sidenav after the upload', async () => {
    const { component, router, facade, sidenav } = render({ reports: [] });

    await component.uploadReport();

    expect(facade.uploadReport).toHaveBeenCalledWith('demo');
    expect(router.navigated).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/projects/demo']);
    await vi.waitFor(() => expect(sidenav.close).toHaveBeenCalledOnce());
    expect(facade.completeUpload).toHaveBeenCalledOnce();
  });

  it('keeps the sidenav open on a page without reports', async () => {
    const { component, router, sidenav } = render({});

    await component.uploadReport();
    await router.navigate.mock.results[0]?.value;

    expect(sidenav.close).not.toHaveBeenCalled();
  });
});
