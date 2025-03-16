import { Component, Inject, LOCALE_ID, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AsyncPipe, NgComponentOutlet, NgIf } from '@angular/common';
import { Meta } from '@angular/platform-browser';

@Component({
  imports: [RouterOutlet, NgComponentOutlet, AsyncPipe, NgIf],
  standalone: true,
  selector: 'app-root',
  template: `
    <ng-container *ngIf="toolbarComponent | async as toolbar">
      <ng-container
        *ngComponentOutlet="toolbar; inputs: toolbarInputs"
      ></ng-container>
    </ng-container>
    <router-outlet />
  `,
  styles: [``]
})
export class AppComponent implements OnInit {
  title = 'TagCheck';
  toolbarComponent = this.loadToolbarComponent();
  toolbarInputs = { title: this.title };

  constructor(
    private router: Router,
    private metaService: Meta,
    @Inject(LOCALE_ID) public locale: string
  ) {}

  ngOnInit() {
    this.router.navigate(['/documentation']);
  }

  private async loadToolbarComponent() {
    try {
      const module = await import('@ui');
      return module.ToolBarComponent;
    } catch (error) {
      console.error('Failed to load toolbar component:', error);
      return null;
    }
  }
}
