import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { beforeEach, describe, expect, it } from 'vitest';
import { ProgressSpinnerComponent } from './progress-spinner.component';

describe('ProgressSpinnerComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressSpinnerComponent],
      providers: [provideNoopAnimations()]
    }).compileComponents();
  });

  it('creates the component', () => {
    const fixture = TestBed.createComponent(ProgressSpinnerComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('returns 0 when inputs are null', () => {
    const fixture = TestBed.createComponent(ProgressSpinnerComponent);
    expect(fixture.componentInstance.getRatio()).toBe(0);
  });

  it('returns 0 when total is 0 to avoid division by zero', () => {
    const fixture = TestBed.createComponent(ProgressSpinnerComponent);
    fixture.componentRef.setInput('numParsedTags', 5);
    fixture.componentRef.setInput('numTotalTags', 0);
    expect(fixture.componentInstance.getRatio()).toBe(0);
  });

  it('returns parsed/total * 100 when both inputs are present', () => {
    const fixture = TestBed.createComponent(ProgressSpinnerComponent);
    fixture.componentRef.setInput('numParsedTags', 3);
    fixture.componentRef.setInput('numTotalTags', 4);
    expect(fixture.componentInstance.getRatio()).toBe(75);
  });

  it('renders the parsed/total label', () => {
    const fixture = TestBed.createComponent(ProgressSpinnerComponent);
    fixture.componentRef.setInput('numParsedTags', 2);
    fixture.componentRef.setInput('numTotalTags', 5);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('2 / 5');
  });
});
