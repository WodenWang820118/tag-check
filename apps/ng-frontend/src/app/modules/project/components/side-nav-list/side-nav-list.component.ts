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

export type NavSection =
  | 'tests'
  | 'tagbuild'
  | 'reports'
  | 'schedules'
  | 'settings';

/**
 * The menu item a project URL belongs to. A test's own page
 * (/projects/:slug/:eventId) belongs to Tests.
 */
export function navSectionOf(url: string): NavSection {
  // Segments of /projects/:slug/<section>/...: ['', 'projects', slug, section].
  const [, root, slug, section] = url.split(/[?#]/u)[0].split('/');
  if (root !== 'projects' || !slug) {
    return 'tests';
  }
  switch (section) {
    case 'tag-build':
      return 'tagbuild';
    case 'buckets':
      return 'reports';
    case 'schedules':
      return 'schedules';
    case 'settings':
      return 'settings';
    default:
      return 'tests';
  }
}

/** The project menu's top-level items; Settings opens its own submenu. */
const NAV_ITEMS: readonly {
  icon: string;
  title: string;
  link: string;
  testId: string;
  section: NavSection;
}[] = [
  {
    icon: 'home',
    title: 'Tests',
    link: './',
    testId: 'nav-tests',
    section: 'tests'
  },
  {
    icon: 'build',
    title: 'TagBuild',
    link: 'tag-build',
    testId: 'nav-tagbuild',
    section: 'tagbuild'
  },
  {
    icon: 'folder_shared',
    title: 'Reports',
    link: 'buckets',
    testId: 'nav-reports',
    section: 'reports'
  },
  {
    icon: 'schedule',
    title: 'Schedules',
    link: 'schedules',
    testId: 'nav-schedules',
    section: 'schedules'
  }
];

const SETTINGS_ITEMS: readonly {
  title: string;
  link: string[];
  testId: string;
}[] = [
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
];

/**
 * The project's side menu: Tests, TagBuild, Reports, Schedules and a Settings submenu
 * shown in an overlay. The item of the current URL is highlighted.
 */
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
  private readonly router = inject(Router);
  snav = input.required<MatSidenav>();
  /** Emitted on a menu choice, so the parent can close an overlay menu. */
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

  /** Whether the Settings submenu is open. */
  isOpen = signal(false);
  readonly items = NAV_ITEMS;
  readonly settingsMenuItems = SETTINGS_ITEMS;

  constructor() {
    // The submenu is an overlay outside the side nav, so it would stay open
    // when the side nav closes.
    effect((onCleanup) => {
      const subscription = this.snav().openedChange.subscribe((isOpen) => {
        if (!isOpen) {
          this.isOpen.set(false);
        }
      });
      onCleanup(() => subscription.unsubscribe());
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
