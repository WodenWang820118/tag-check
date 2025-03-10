import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'ng-product-doc-root',
  imports: [RouterOutlet],
  template: ` <router-outlet></router-outlet> `
})
export class AppComponent {}
