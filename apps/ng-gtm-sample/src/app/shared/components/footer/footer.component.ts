import { Component } from '@angular/core';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-footer',
  imports: [ToolbarModule, ButtonModule, InputTextModule],
  template: `
    <p-toolbar
      class="footer-toolbar"
      [style]="{ 'border-radius': '0', padding: '0.5rem' }"
    >
      <ng-template #start>
        <div id="externalLinks">
          <ul>
            <li>
              Developer:&nbsp;
              <a href="https://github.com/WodenWang820118">Guan Xin Wang</a>
            </li>
          </ul>
        </div>
      </ng-template>
      <ng-template #end>
        <div id="newsletter-form" class="p-d-flex p-ai-center">
          <input
            pInputText
            type="text"
            id="newsletter"
            placeholder="Newsletter..."
          />
          <button
            pButton
            type="button"
            label="OK"
            class="p-button-text p-ml-2"
          ></button>
          <div id="response" class="p-ml-3"></div>
        </div>
      </ng-template>
    </p-toolbar>
  `,
})
export class FooterComponent {}
