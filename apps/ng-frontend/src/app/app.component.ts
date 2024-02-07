import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToolbarComponent } from './components/toolbar/toolbar.component';

@Component({
  standalone: true,
  imports: [RouterModule, ToolbarComponent],
  selector: 'app-root',
  template: `
    <app-toolbar></app-toolbar>
    <router-outlet></router-outlet>
  `,
})
export class AppComponent {
  title = 'ng-frontend';
}
