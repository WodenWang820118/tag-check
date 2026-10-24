import { MatFormFieldModule } from '@angular/material/form-field';
import { Project, ProjectSetting } from '@utils';
import {
  Component,
  input,
  model,
  output,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { filter, map } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink
} from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenav } from '@angular/material/sidenav';
import { MatSelectModule } from '@angular/material/select';
import { MetadataSourceService } from '../../services/data-source/metadata-source.service';
import { MatInputModule } from '@angular/material/input';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * The app bar. On the home page it offers the project search, new project
 * and help; on a project page, the menu toggle and the project switcher.
 */
@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    RouterLink,
    MatMenuModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule
  ],
  templateUrl: './toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent {
  snav = input<MatSidenav | undefined>();
  settings = input.required<ProjectSetting | undefined>();
  projects = input.required<Project[] | undefined>();
  params = toSignal(this.route.params, {
    initialValue: { projectSlug: '' }
  });

  // Convert output to signal-based model
  selectedProject = model<string>(this.params().projectSlug);
  changeProject = output<string>();

  isSearchVisible = signal(false);
  /**
   * Whether the home page shows. Each project page creates a toolbar, so
   * the subscription must end with it; toSignal ends it on destroy.
   */
  readonly isHomeView = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.url === '/')
    ),
    { initialValue: false }
  );

  constructor(
    private readonly metadataSourceService: MetadataSourceService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  onChangeProject(projectSlug: string) {
    this.selectedProject.set(projectSlug);
    this.changeProject.emit(projectSlug);
  }

  toggleSearch() {
    this.isSearchVisible.update((value) => !value);
  }

  /** Closes the project search and shows every project again. */
  closeSearch() {
    this.isSearchVisible.set(false);
    this.metadataSourceService.setFilterSignal('');
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.metadataSourceService.setFilterSignal(filterValue);
  }
}
