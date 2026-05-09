import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginatorButtonComponent } from './paginator-button.component';

describe('PaginatorButtonComponent', () => {
  let fixture: ComponentFixture<PaginatorButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginatorButtonComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(PaginatorButtonComponent);
  });

  it('renders the provided label inside the button', () => {
    fixture.componentInstance.label = 'Next';
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.textContent.trim()).toBe('Next');
    expect(btn.disabled).toBe(false);
  });

  it('reflects the disabled input on the button element', () => {
    fixture.componentInstance.disabled = true;
    fixture.detectChanges();
    expect(
      (fixture.nativeElement.querySelector('button') as HTMLButtonElement)
        .disabled
    ).toBe(true);
  });

  it('invokes the onClick callback when the button is pressed', () => {
    const handler = vi.fn();
    fixture.componentInstance.onClick = handler;
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
