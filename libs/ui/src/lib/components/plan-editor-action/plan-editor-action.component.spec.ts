import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { PlanEditorActionComponent } from './plan-editor-action.component';

describe('PlanEditorActionComponent', () => {
  let fixture: ComponentFixture<PlanEditorActionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanEditorActionComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(PlanEditorActionComponent);
    fixture.detectChanges();
  });

  it('renders a write plan button with data-testid tagbuild-write-plan', () => {
    const button: HTMLButtonElement | null =
      fixture.nativeElement.querySelector(
        '[data-testid="tagbuild-write-plan"]'
      );
    expect(button).not.toBeNull();
    expect(button?.textContent?.trim()).toBe('Write plan');
  });

  it('emits planClick when the button is clicked', () => {
    let emissions = 0;
    fixture.componentInstance.planClick.subscribe(() => emissions++);

    const button: HTMLButtonElement | null =
      fixture.nativeElement.querySelector(
        '[data-testid="tagbuild-write-plan"]'
      );
    button?.click();

    expect(emissions).toBe(1);
  });
});
