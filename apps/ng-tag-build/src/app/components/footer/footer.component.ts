import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `<footer class="footer">
    <div class="footer__container">
      <p class="text-muted">
        Created by:
        <a href="https://www.linkedin.com/in/brandon-pardede/" target="_blank">
          Brandon Pardede</a
        >
        and
        <a href="https://www.linkedin.com/in/guan-xin-wang/" target="_blank"
          >Guan Xin Wang</a
        >
      </p>
      <p class="text-muted">
        Contact:
        <a href="mailto:guanxinwang0118@gmail.com"
          >guanxinwang0118&#64;gmail.com</a
        >
      </p>
      <p class="text-muted">
        <a
          href="https://github.com/WodenWang820118/gtm-config-generator"
          target="_blank"
          >View on GitHub</a
        >
      </p>
      <p class="text-muted">Last updated on: 2024-01-13</p>
    </div>
  </footer> `,
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {}
