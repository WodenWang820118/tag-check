import { Component } from '@angular/core';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-admin-home',
    imports: [NavbarComponent, RouterOutlet],
    template: `
    <div style="margin-bottom: 5rem;">
      <app-navbar></app-navbar>
    </div>
    <div class="pcoded-main-container">
      <div class="pcoded-wrapper">
        <div class="pcoded-content">
          <div class="pcoded-inner-content">
            <div class="main-body">
              <div class="page-wrapper">
                <router-outlet></router-outlet>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [``]
})
export class HomeComponent {}
