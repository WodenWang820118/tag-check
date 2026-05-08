import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { beforeEach, describe, expect, it } from 'vitest';
import { ErrorDialogComponent } from './error-dialog.component';

describe('ErrorDialogComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: { message: 'Boom' } },
        {
          provide: MatDialogRef,
          useValue: { close: () => undefined }
        }
      ]
    }).compileComponents();
  });

  it('renders the supplied error message', () => {
    const fixture = TestBed.createComponent(ErrorDialogComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Boom');
    expect(fixture.componentInstance.data).toEqual({ message: 'Boom' });
  });
});
