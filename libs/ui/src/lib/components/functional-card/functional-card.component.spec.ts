import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FunctionalCardComponent } from './functional-card.component';

describe('FunctionalCardComponent', () => {
  let component: FunctionalCardComponent;
  let fixture: ComponentFixture<FunctionalCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FunctionalCardComponent]
    });
    fixture = TestBed.createComponent(FunctionalCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
