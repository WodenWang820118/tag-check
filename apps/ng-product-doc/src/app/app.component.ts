import { Component, Inject, LOCALE_ID, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AsyncPipe, NgComponentOutlet, NgIf } from '@angular/common';
import { Meta } from '@angular/platform-browser';

@Component({
  imports: [RouterOutlet, NgComponentOutlet, AsyncPipe, NgIf],
  standalone: true,
  selector: 'app-root',
  template: `
    <div class="app-container">
      <ng-container *ngIf="toolbarComponent | async as toolbar">
        <ng-container
          *ngComponentOutlet="toolbar; inputs: toolbarInputs"
        ></ng-container>
      </ng-container>
      <div class="app-content">
        <router-outlet />
      </div>
    </div>
    @defer (on viewport) {
      @if (footerComponent | async) {
        <ng-container
          *ngComponentOutlet="footerComponent | async"
        ></ng-container>
      }
    } @placeholder {
      <div></div>
    }
  `,
  styles: [
    `
      .app-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        overflow: hidden;
      }
      .app-content {
        flex: 1;
        overflow: hidden;
      }
    `
  ]
})
export class AppComponent implements OnInit {
  title = 'TagCheck';
  toolbarComponent = this.loadToolbarComponent();
  footerComponent = this.loadFooterComponent();
  toolbarInputs = {
    title: this.title,
    aboutDisabled: true,
    objectivesDisabled: false
  };

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

  private async loadFooterComponent() {
    const module = await import('@ui');
    return module.FooterComponent;
  }
}
