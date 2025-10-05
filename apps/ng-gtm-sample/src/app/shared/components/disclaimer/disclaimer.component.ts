import { Component } from '@angular/core';

@Component({
  selector: 'app-disclaimer',
  template: `
    <div id="disclaimer">
      <div class="container">
        <span>This is a demo site designed to showcase GTM. </span>
        <!-- <a href="#">Back to top</a> -->
      </div>
    </div>
  `,
  styles: [
    `
      #disclaimer {
        margin: 0;
        padding: 0;
        background: #333 !important;
        color: #fff;
        padding: 10px 0;
        font-weight: 100;
      }

      #disclaimer .container {
        position: relative;
      }

      #disclaimer a {
        position: absolute;
        right: 0;
      }

      .clear {
        clear: both;
      }
    `,
  ],
})
export class DisclaimerComponent {}
