import {
  Component,
  ViewEncapsulation,
  input,
  output,
  signal,
  effect,
  ChangeDetectionStrategy
} from '@angular/core';
import { NgClass } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import {
  ActivatedRoute,
  IsActiveMatchOptions,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { OverlayComponent } from '../overlay/overlay.component';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenav } from '@angular/material/sidenav';

@Component({
  selector: 'app-side-nav-list',
  standalone: true,
  imports: [
    MatListModule,
    MatIconModule,
    RouterLink,
    MatMenuModule,
    OverlayModule,
    OverlayComponent,
    MatButtonModule,
    RouterLinkActive,
    NgClass
  ],
  templateUrl: './side-nav-list.component.html',
  styleUrls: ['./side-nav-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None
})
export class SideNavListComponent {
  snav = input.required<MatSidenav>();
  menuClick = output<void>();
  routerLinkActiveOptions = signal<IsActiveMatchOptions>({
    paths: 'exact',
    queryParams: 'ignored',
    matrixParams: 'ignored',
    fragment: 'ignored'
  });

  selectedParent = signal<string | null>(null);
  isOpen = signal(false);
  items = signal<
    {
      icon: string;
      title: string;
      link: string;
      testId: string;
      subTitle?: string;
    }[]
  >([]);

  settingsMenuItems = signal([
    {
      title: 'Project Information',
      link: ['./', 'settings', 'project-info'],
      testId: 'nav-settings-project-info'
    },
    {
      title: 'Preloading Values',
      link: ['./', 'settings', 'pre-loading-values'],
      testId: 'nav-settings-preloading-values'
    },
    {
      title: 'Authentication',
      link: ['./', 'settings', 'authentication'],
      testId: 'nav-settings-authentication'
    },
    {
      title: 'Google Tag Manager',
      link: ['./', 'settings', 'gtm'],
      testId: 'nav-settings-gtm'
    },
    {
      title: 'Advanced Browser',
      link: ['./', 'settings', 'advanced-browser-settings'],
      testId: 'nav-settings-browser'
    },
    {
      title: 'Project IO',
      link: ['./', 'settings', 'project-io'],
      testId: 'nav-settings-project-io'
    }
  ]);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    // Convert router subscription to effect
    effect(() => {
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.updateParentTitle();
        }
      });
    });

    // Convert route params subscription to effect
    effect(() => {
      this.route.params.subscribe((params) => {
        const projectSlug = params['projectSlug'];
        this.items.set([
          {
            icon: 'home',
            title: 'Tests',
            link: `./`,
            testId: 'nav-tests',
            subTitle: projectSlug
          },
          {
            icon: 'build',
            title: 'TagBuild',
            link: `tag-build`,
            testId: 'nav-tagbuild'
          },
          {
            icon: 'folder_shared',
            title: 'Reports',
            link: `buckets`,
            testId: 'nav-reports'
          },
          {
            icon: 'settings',
            title: 'Settings',
            link: `settings`,
            testId: 'nav-settings'
          }
        ]);
      });
    });

    // Convert snav subscription to effect
    effect(() => {
      this.snav().openedChange.subscribe((isOpen) => {
        if (isOpen === false) {
          this.isOpen.set(false);
        }
      });
    });
  }

  onMenuClick() {
    this.menuClick.emit();
  }

  toggleSettings() {
    this.isOpen.set(!this.isOpen());
  }

  private updateParentTitle() {
    const currentUrl = this.router.url;
    if (currentUrl.includes('/settings')) {
      this.selectedParent.set('Settings');
    } else if (currentUrl.includes('/other-parent')) {
      this.selectedParent.set('OtherParent');
    } else {
      this.selectedParent.set(null);
    }
  }

  onSubItemClick(parentTitle: string) {
    this.selectedParent.set(parentTitle);
    this.isOpen.set(false);
    this.onMenuClick();
  }
}
