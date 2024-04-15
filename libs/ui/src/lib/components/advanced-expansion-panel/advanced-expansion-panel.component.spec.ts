import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvancedExpansionPanelComponent } from './advanced-expansion-panel.component';

describe('AdvancedExpansionPanelComponent', () => {
  let component: AdvancedExpansionPanelComponent;
  let fixture: ComponentFixture<AdvancedExpansionPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdvancedExpansionPanelComponent]
    });
    fixture = TestBed.createComponent(AdvancedExpansionPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
