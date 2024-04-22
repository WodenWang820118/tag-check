import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [CommonModule],
  template: `<p>side bar works</p>`,
  styles: [``],
})
export class SideBarComponent implements OnDestroy {
  destroy$ = new Subject<void>();

  constructor() {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
