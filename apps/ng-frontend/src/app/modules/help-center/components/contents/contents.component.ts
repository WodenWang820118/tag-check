import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-contents',
  standalone: true,
  imports: [CommonModule],
  template: `<p>conents works!</p>`,
  styles: [``],
})
export class ConentsComponent implements OnDestroy {
  destroy$ = new Subject<void>();

  constructor() {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
