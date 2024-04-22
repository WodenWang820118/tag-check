import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { ConentsComponent } from '../components/contents/contents.component';
import { SideBarComponent } from '../components/side-bar/side-bar.component';

@Component({
  selector: 'app-help-center-view',
  standalone: true,
  imports: [CommonModule, ConentsComponent, SideBarComponent],
  template: `
    <app-side-bar></app-side-bar>
    <app-contents></app-contents>
  `,
  styles: [``],
})
export class HelpCenterComponent implements OnDestroy {
  destroy$ = new Subject<void>();

  constructor() {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
