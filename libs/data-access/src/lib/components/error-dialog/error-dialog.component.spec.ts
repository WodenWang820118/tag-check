import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ErrorDialogComponent } from './error-dialog.component';

describe('ErrorDialogComponent', () => {
  let fixture: ComponentFixture<ErrorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorDialogComponent],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: { message: 'Boom!' } }]
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorDialogComponent);
    fixture.detectChanges();
  });

  it('renders the injected error message', () => {
    expect(fixture.componentInstance.data.message).toBe('Boom!');
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Error');
    expect(text).toContain('Boom!');
  });
});
