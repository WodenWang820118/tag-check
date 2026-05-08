import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HelpCenterViewComponent } from './documentation-view.component';

describe('HelpCenterViewComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpCenterViewComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('renders the documentation layout with sidebar and outlet', () => {
    const fixture = TestBed.createComponent(HelpCenterViewComponent);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelector('.documentation-layout')).toBeTruthy();
    expect(host.querySelector('app-sidebar')).toBeTruthy();
    expect(host.querySelector('router-outlet')).toBeTruthy();
  });
});
