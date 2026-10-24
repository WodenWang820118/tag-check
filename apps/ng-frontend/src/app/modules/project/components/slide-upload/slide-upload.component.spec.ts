import { TestBed } from '@angular/core/testing';
import { MatSidenav } from '@angular/material/sidenav';
import { describe, expect, it, vi } from 'vitest';
import { UploadSpecService } from '../../../../shared/services/upload-spec/upload-spec.service';
import { SlideUploadComponent } from './slide-upload.component';

/** The part of MatSidenav the component uses. */
function fakeSidenav(opened: boolean) {
  return {
    opened,
    open: vi.fn().mockResolvedValue('open'),
    close: vi.fn().mockResolvedValue('close')
  };
}

function render(sidenav: ReturnType<typeof fakeSidenav>) {
  const uploadSpecService = {
    resetStart: vi.fn(),
    openImportSidenav: vi.fn()
  };
  TestBed.configureTestingModule({
    imports: [SlideUploadComponent],
    providers: [{ provide: UploadSpecService, useValue: uploadSpecService }]
  });
  TestBed.overrideComponent(SlideUploadComponent, {
    set: { template: '', imports: [] }
  });
  const fixture = TestBed.createComponent(SlideUploadComponent);
  fixture.componentRef.setInput('sidenav', sidenav as unknown as MatSidenav);
  return { component: fixture.componentInstance, uploadSpecService };
}

describe('SlideUploadComponent', () => {
  it('opens a closed sidenav', () => {
    const sidenav = fakeSidenav(false);
    const { component } = render(sidenav);

    component.toggleSidenav();

    expect(sidenav.open).toHaveBeenCalledOnce();
  });

  it('closes an open sidenav and resets the upload', () => {
    const sidenav = fakeSidenav(true);
    const { component, uploadSpecService } = render(sidenav);

    component.toggleSidenav();

    expect(sidenav.close).toHaveBeenCalledOnce();
    expect(uploadSpecService.resetStart).toHaveBeenCalledOnce();
  });

  it('switches to the import panel', () => {
    const { component, uploadSpecService } = render(fakeSidenav(true));

    component.emitOpenImportSidenav();

    expect(uploadSpecService.openImportSidenav).toHaveBeenCalledOnce();
  });
});
