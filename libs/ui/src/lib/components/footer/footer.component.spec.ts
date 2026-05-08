import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent]
    }).compileComponents();
  });

  it('renders the footer container', () => {
    const fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.footer')).toBeTruthy();
  });

  it('renders contact and source links', () => {
    const fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
    const links = Array.from(
      fixture.nativeElement.querySelectorAll('a')
    ) as HTMLAnchorElement[];
    const hrefs = links.map((a) => a.getAttribute('href'));
    expect(hrefs.some((h) => h?.startsWith('mailto:'))).toBe(true);
    expect(
      hrefs.some((h) => h?.includes('github.com/WodenWang820118/tag-check'))
    ).toBe(true);
    expect(hrefs.some((h) => h?.includes('linkedin.com'))).toBe(true);
  });
});
