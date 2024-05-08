import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToolbarComponent } from './shared/components/toolbar/toolbar.component';

@Component({
  standalone: true,
  imports: [RouterOutlet, ToolbarComponent],
  selector: 'app-root',
  template: `
    @defer(on immediate) {
    <app-toolbar></app-toolbar>
    } @loading {
    <div style="height: 60px"></div>
    }
    <router-outlet></router-outlet>
  `,
})
export class AppComponent {
  title = 'Tag Check';
}
