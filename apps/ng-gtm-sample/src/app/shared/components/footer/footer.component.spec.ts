import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('shows the GitHub icon in the credits link', async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent]
    }).compileComponents();

    const fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const link: HTMLAnchorElement =
      fixture.nativeElement.querySelector('#externalLinks a');
    expect(link.getAttribute('href')).toBe(
      'https://github.com/WodenWang820118'
    );
    expect(link.querySelector('ng-icon svg path')).not.toBeNull();
  });
});
