import {
  Component,
  ViewEncapsulation,
  input,
  output,
  signal,
  effect,
  ChangeDetectionStrategy,
  computed,
  inject
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import {
  ActivatedRoute,
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

export type NavSection = 'tests' | 'tagbuild' | 'reports' | 'settings';

/**
 * The menu item a project URL belongs to. A test's own page
 * (/projects/:slug/:eventId) belongs to Tests.
 */
export function navSectionOf(url: string): NavSection {
  const path = url.split(/[?#]/u)[0];
  const rest = /^\/projects\/[^/]+\/?(.*)$/u.exec(path)?.[1] ?? '';
  switch (rest.split('/')[0]) {
    case 'tag-build':
      return 'tagbuild';
    case 'buckets':
      return 'reports';
    case 'settings':
      return 'settings';
    default:
      return 'tests';
  }
}

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
    RouterLinkActive
  ],
  templateUrl: './side-nav-list.component.html',
  styleUrls: ['./side-nav-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None
})
export class SideNavListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  snav = input.required<MatSidenav>();
  menuClick = output<void>();
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );
  /** The highlighted menu item, from the current URL. */
  readonly section = computed(() => navSectionOf(this.url()));

  isOpen = signal(false);
  items = signal<
    {
      icon: string;
      title: string;
      link: string;
      testId: string;
      subTitle?: string;
      section: NavSection;
    }[]
  >([]);

  settingsMenuItems = signal([
    {
      title: 'Project Information',
      link: ['./', 'settings', 'project-info'],
      testId: 'nav-settings-project-info'
    },
    {
      title: 'Pre-loading Values',
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
      title: 'Browser Settings',
      link: ['./', 'settings', 'advanced-browser-settings'],
      testId: 'nav-settings-browser'
    },
    {
      title: 'Export or Delete',
      link: ['./', 'settings', 'project-io'],
      testId: 'nav-settings-project-io'
    }
  ]);

  constructor() {
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
            section: 'tests',
            subTitle: projectSlug
          },
          {
            icon: 'build',
            title: 'TagBuild',
            link: `tag-build`,
            testId: 'nav-tagbuild',
            section: 'tagbuild'
          },
          {
            icon: 'folder_shared',
            title: 'Reports',
            link: `buckets`,
            testId: 'nav-reports',
            section: 'reports'
          },
          {
            icon: 'settings',
            title: 'Settings',
            link: `settings`,
            testId: 'nav-settings',
            section: 'settings'
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

  onSubItemClick() {
    this.isOpen.set(false);
    this.onMenuClick();
  }
}
