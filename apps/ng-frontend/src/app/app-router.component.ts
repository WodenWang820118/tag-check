// router.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterOutlet],
  selector: 'app-router-container',
  template: `<router-outlet></router-outlet>`
})
export class RouterContainerComponent {}
