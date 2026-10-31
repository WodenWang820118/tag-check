import {
  Component,
  computed,
  inject,
  Signal,
  ViewEncapsulation,
  ChangeDetectionStrategy
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ActivatedRoute, Data, Router, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { Project, ProjectSetting } from '@utils';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { ToolbarComponent } from '../../../../shared/components/toolbar/toolbar.component';
import { SideNavListComponent } from '../../components/side-nav-list/side-nav-list.component';

// Below this width the 246px menu leaves the tests table too narrow for its
// run buttons, so the menu slides over the content instead.
const WIDE_LAYOUT_QUERY = '(min-width: 1280px)';

/**
 * A project's frame: the toolbar with the project switcher, the side
 * menu and the routed page.
 */
@Component({
  selector: 'app-project-view',
  standalone: true,
  imports: [
    RouterOutlet,
    MatSidenavModule,
    ToolbarComponent,
    SideNavListComponent
  ],
  template: `
    <div class="project-view">
      <!-- receive the $event from the toolbar and switch the project -->
      <app-toolbar
        [settings]="project()"
        [snav]="snav"
        [projects]="projectInfo()"
        (changeProject)="onChangeProject($event, snav)"
      ></app-toolbar>

      <!-- Wide screens keep the menu beside the content; narrow ones slide it over. -->
      <mat-sidenav-container
        class="project-view__sidenav-container"
        [hasBackdrop]="!isWide()"
        (backdropClick)="snav.close()"
      >
        <mat-sidenav
          #snav
          [opened]="isWide()"
          [mode]="isWide() ? 'side' : 'over'"
          fixedTopGap="56"
        >
          <app-side-nav-list
            [snav]="snav"
            (menuClick)="closeOverlayMenu(snav)"
          ></app-side-nav-list>
        </mat-sidenav>
        <mat-sidenav-content>
          <div class="table-container">
            <router-outlet></router-outlet>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styleUrls: ['./project-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None
})
export class ProjectViewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);

  private readonly routeData: Signal<Data> = toSignal(this.route.data, {
    initialValue: this.route.snapshot.data
  });

  readonly project = computed<ProjectSetting>(
    () =>
      (this.routeData()['projectSetting'] as ProjectSetting) ??
      ({} as ProjectSetting)
  );
  readonly projectInfo = computed<Project[]>(
    () => (this.routeData()['projectInfo'] as Project[]) ?? []
  );

  readonly isWide = toSignal(
    this.breakpointObserver
      .observe(WIDE_LAYOUT_QUERY)
      .pipe(map((state) => state.matches)),
    {
      initialValue: this.breakpointObserver.isMatched(WIDE_LAYOUT_QUERY)
    }
  );

  onChangeProject(projectSlug: string, snav: MatSidenav) {
    this.closeOverlayMenu(snav);
    void this.router.navigate(['/projects', projectSlug]);
  }

  /** The side-by-side menu stays open; the overlay closes after a choice. */
  closeOverlayMenu(snav: MatSidenav) {
    if (!this.isWide()) {
      void snav.close();
    }
  }
}
