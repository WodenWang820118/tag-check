import { Component } from '@angular/core';

@Component({
  selector: 'lib-footer',
  standalone: true,
  template: `<footer class="footer">
    <div class="footer__container">
      <p class="text-muted">
        <ng-container i18n="@@footerComponentCreatedBy"
          >Created by:</ng-container
        >
        <a
          i18n="@@footerComponentAuthorName"
          href="https://www.linkedin.com/in/guan-xin-wang/"
          target="_blank"
          >Guan Xin Wang</a
        >
      </p>
      <p class="text-muted">
        <ng-container i18n="@@footerComponentContact">Contact:</ng-container>
        <a href="mailto:guanxinwang0118@gmail.com"
          >guanxinwang0118&#64;gmail.com</a
        >
      </p>
      <p class="text-muted">
        <a href="https://github.com/WodenWang820118/tag-check" target="_blank">
          <ng-container i18n="@@footerComponentGitHub"
            >View on GitHub</ng-container
          >
        </a>
      </p>
      <p class="text-muted">
        <ng-container i18n="@@footerComponentLastUpdated"
          >Last updated on: 2024-12-29</ng-container
        >
      </p>
    </div>
  </footer>`,
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {}
