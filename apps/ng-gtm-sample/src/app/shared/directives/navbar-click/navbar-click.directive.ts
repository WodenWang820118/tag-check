import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appNavbarClick]',
  standalone: true,
})
export class NavbarClickDirective {
  constructor(private el: ElementRef, private renderer: Renderer2) {}
  @HostListener('click') onClick() {
    if (this.el.nativeElement.classList.contains('show')) {
      this.renderer.removeClass(this.el.nativeElement, 'show');
    }
  }
}
