import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ErrorDialogComponent } from './error-dialog.component';

describe('ErrorDialogComponent', () => {
  function configure(message: string) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ErrorDialogComponent],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: { message } }]
    });
    return TestBed.createComponent(ErrorDialogComponent);
  }

  it('exposes the injected dialog data on the component', () => {
    const fixture = configure('boom');
    expect(fixture.componentInstance.data.message).toBe('boom');
  });

  it('renders the message in the dialog body', () => {
    const fixture = configure('something failed');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('something failed');
  });
});
