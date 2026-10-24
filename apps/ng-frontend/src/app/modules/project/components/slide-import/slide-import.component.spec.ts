import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSidenav } from '@angular/material/sidenav';
import { describe, expect, it, vi } from 'vitest';
import { UploadSpecService } from '../../../../shared/services/upload-spec/upload-spec.service';
import { SlideImportComponent } from './slide-import.component';

function fakeSidenav(opened: boolean) {
  return {
    opened,
    toggle: vi.fn().mockResolvedValue('open'),
    close: vi.fn().mockResolvedValue('close')
  };
}

function render(
  sidenav: ReturnType<typeof fakeSidenav>,
  state = { uploaded: false, importOpen: true }
) {
  const uploadSpecService = {
    isUploaded: signal(state.uploaded),
    isOpenImportSidenav: signal(state.importOpen),
    resetImport: vi.fn()
  };
  TestBed.configureTestingModule({
    imports: [SlideImportComponent],
    providers: [{ provide: UploadSpecService, useValue: uploadSpecService }]
  });
  TestBed.overrideComponent(SlideImportComponent, {
    set: { template: '', imports: [] }
  });
  const fixture = TestBed.createComponent(SlideImportComponent);
  fixture.componentRef.setInput(
    'importedSidenav',
    sidenav as unknown as MatSidenav
  );
  return { component: fixture.componentInstance, uploadSpecService };
}

describe('SlideImportComponent', () => {
  it('toggles the sidenav', () => {
    const sidenav = fakeSidenav(false);
    const { component } = render(sidenav);

    component.toggleSidenav();

    expect(sidenav.toggle).toHaveBeenCalledOnce();
  });

  it('closes an open sidenav and resets the import', () => {
    const sidenav = fakeSidenav(true);
    const { component, uploadSpecService } = render(sidenav);

    component.closeIfOpen();

    expect(sidenav.close).toHaveBeenCalledOnce();
    expect(uploadSpecService.resetImport).toHaveBeenCalledOnce();
  });

  it('leaves a closed sidenav alone', () => {
    const sidenav = fakeSidenav(false);
    const { component, uploadSpecService } = render(sidenav);

    component.closeIfOpen();

    expect(sidenav.close).not.toHaveBeenCalled();
    expect(uploadSpecService.resetImport).not.toHaveBeenCalled();
  });

  it('shows the import panel only until the upload is done', () => {
    expect(render(fakeSidenav(true)).component.sidenavOpen()).toBe(true);
    TestBed.resetTestingModule();
    expect(
      render(fakeSidenav(true), {
        uploaded: true,
        importOpen: true
      }).component.sidenavOpen()
    ).toBe(false);
  });
});
