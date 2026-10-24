import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UploadSpecService } from '../../../../shared/services/upload-spec/upload-spec.service';
import { ReportBigTableComponent } from './report-big-table.component';

/**
 * Renders the view with only its sidenav: the effect under test opens and
 * closes that sidenav from the upload service's state.
 */
function render(state: {
  started: boolean;
  uploaded: boolean;
  importOpen: boolean;
}) {
  const uploadSpecService = {
    isStarted: signal(state.started),
    isUploaded: signal(state.uploaded),
    isOpenImportSidenav: signal(state.importOpen),
    resetStart: vi.fn(),
    resetImport: vi.fn(),
    completeUpload: vi.fn()
  };
  TestBed.configureTestingModule({
    imports: [ReportBigTableComponent],
    providers: [
      provideNoopAnimations(),
      { provide: UploadSpecService, useValue: uploadSpecService }
    ]
  });
  TestBed.overrideComponent(ReportBigTableComponent, {
    set: {
      imports: [MatSidenavModule],
      template: `
        <mat-sidenav-container>
          <mat-sidenav #sheet mode="over"></mat-sidenav>
        </mat-sidenav-container>
      `
    }
  });
  const open = vi.spyOn(MatSidenav.prototype, 'open');
  const close = vi.spyOn(MatSidenav.prototype, 'close');
  const fixture = TestBed.createComponent(ReportBigTableComponent);
  fixture.detectChanges();
  return { fixture, open, close, uploadSpecService };
}

describe('ReportBigTableComponent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.style.overflow = '';
  });

  it('opens the sidenav and locks page scroll while adding tests', () => {
    const { open } = render({
      started: true,
      uploaded: false,
      importOpen: false
    });

    expect(open).toHaveBeenCalled();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('keeps the sidenav closed when no panel is requested', () => {
    const { open, close } = render({
      started: false,
      uploaded: false,
      importOpen: false
    });

    expect(open).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('closes on a backdrop click and resets the panels once closed', () => {
    const { fixture, close, uploadSpecService } = render({
      started: true,
      uploaded: false,
      importOpen: false
    });

    fixture.componentInstance.onBackdrop();
    fixture.detectChanges();
    fixture.componentInstance.onClosed();
    fixture.destroy();

    expect(close).toHaveBeenCalled();
    expect(uploadSpecService.resetStart).toHaveBeenCalledOnce();
    expect(uploadSpecService.resetImport).toHaveBeenCalledOnce();
    expect(uploadSpecService.completeUpload).toHaveBeenCalledOnce();
  });
});
