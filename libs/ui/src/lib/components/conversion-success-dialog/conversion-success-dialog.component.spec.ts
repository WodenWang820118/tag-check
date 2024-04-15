import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConversionSuccessDialogComponent } from './conversion-success-dialog.component';

describe('ConversionSuccessDialogComponent', () => {
  let component: ConversionSuccessDialogComponent;
  let fixture: ComponentFixture<ConversionSuccessDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConversionSuccessDialogComponent]
    });
    fixture = TestBed.createComponent(ConversionSuccessDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
