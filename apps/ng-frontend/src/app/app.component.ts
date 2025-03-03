import { Component } from '@angular/core';
import { ToolbarComponent } from './shared/components/toolbar/toolbar.component';
import { RouterContainerComponent } from './app-router.component';

@Component({
  standalone: true,
  imports: [RouterContainerComponent, ToolbarComponent],
  selector: 'app-root',
  template: `
    @defer {
      <app-toolbar [settings]="undefined" [projects]="undefined"></app-toolbar>
    } @placeholder {
      <div style="height: 60px"></div>
    }
    @defer {
      <app-router-container></app-router-container>
    } @placeholder {
      <div>Loading application...</div>
    }
  `
})
export class AppComponent {
  title = 'Tag Check';
}
