import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NavbarComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<app-navbar></app-navbar>`
})
export class HeaderComponent {}
