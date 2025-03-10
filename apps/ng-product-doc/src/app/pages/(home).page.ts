import { Component } from '@angular/core';

import { AnalogWelcomeComponent } from './analog-welcome.component';

@Component({
  selector: 'ng-product-doc-home',

  imports: [AnalogWelcomeComponent],
  template: ` <ng-product-doc-analog-welcome /> `
})
export default class HomeComponent {}
