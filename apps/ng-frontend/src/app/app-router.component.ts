import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterOutlet],
  selector: 'app-router-container',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `<router-outlet></router-outlet>`
})
export class RouterContainerComponent {}
