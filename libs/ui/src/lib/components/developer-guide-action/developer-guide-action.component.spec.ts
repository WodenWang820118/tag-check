import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeveloperGuideActionComponent } from './developer-guide-action.component';
import { describe, expect, it, beforeEach } from 'vitest';

describe('DeveloperGuideActionComponent', () => {
  let fixture: ComponentFixture<DeveloperGuideActionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeveloperGuideActionComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(DeveloperGuideActionComponent);
    fixture.detectChanges();
  });

  it('renders a button with testid tagbuild-developer-guide', () => {
    const button: HTMLButtonElement | null =
      fixture.nativeElement.querySelector(
        '[data-testid="tagbuild-developer-guide"]'
      );
    expect(button).not.toBeNull();
    expect(button?.textContent?.trim()).toBe('For developers');
  });

  it('emits guideClick when the button is clicked', () => {
    let emissions = 0;
    fixture.componentInstance.guideClick.subscribe(() => {
      emissions++;
    });
    const button: HTMLButtonElement | null =
      fixture.nativeElement.querySelector(
        '[data-testid="tagbuild-developer-guide"]'
      );
    button?.click();
    expect(emissions).toBe(1);
  });
});
