import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavbarClickDirective } from './navbar-click.directive';

@Component({
  selector: 'app-navbar-click-host',
  standalone: true,
  imports: [NavbarClickDirective],
  template: '<div appNavbarClick></div>'
})
class NavbarClickHostComponent {}

describe('NavbarClickDirective', () => {
  it('should create an instance', () => {
    const fixture = TestBed.createComponent(NavbarClickHostComponent);
    fixture.detectChanges();

    const host = fixture.debugElement.children[0];
    expect(host).toBeTruthy();
    if (!host) {
      return;
    }

    expect(host.injector.get(NavbarClickDirective)).toBeTruthy();
  });
});
