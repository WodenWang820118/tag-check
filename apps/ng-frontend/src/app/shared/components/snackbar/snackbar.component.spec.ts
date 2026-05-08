import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBarRef
} from '@angular/material/snack-bar';
import { SnackBarComponent } from './snackbar.component';

describe('SnackBarComponent', () => {
  it('exposes the injected message data', () => {
    TestBed.configureTestingModule({
      imports: [SnackBarComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_SNACK_BAR_DATA, useValue: 'Saved!' },
        {
          provide: MatSnackBarRef,
          useValue: { dismissWithAction: vi.fn() }
        }
      ]
    });
    const fixture = TestBed.createComponent(SnackBarComponent);
    expect(fixture.componentInstance.data).toBe('Saved!');
  });

  it('dismisses the snackbar when the close button is clicked', () => {
    const dismiss = vi.fn();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SnackBarComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_SNACK_BAR_DATA, useValue: 'msg' },
        { provide: MatSnackBarRef, useValue: { dismissWithAction: dismiss } }
      ]
    });
    const fixture = TestBed.createComponent(SnackBarComponent);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    expect(dismiss).toHaveBeenCalledTimes(1);
  });
});
