import { MatFormFieldModule } from '@angular/material/form-field';
import { ProjectInfo, Setting } from '@utils';
import { Component, effect, input, model, output, signal } from '@angular/core';
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
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent {
  // Convert inputs to signal inputs
  snav = input<MatSidenav | undefined>();
  settings = input.required<Setting | undefined>();
  projects = input.required<ProjectInfo[] | undefined>();
  params = toSignal(this.route.params, {
    initialValue: { projectSlug: '' }
  });

  // Convert output to signal-based model
  selectedProject = model<string>(this.params().projectSlug);
  changeProject = output<string>();

  // Convert state to signals
  isSearchVisible = signal(false);
  isHomeView = signal(false);

  constructor(
    private metadataSourceService: MetadataSourceService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Handle navigation with effect
    effect(
      () => {
        this.router.events.subscribe((event) => {
          if (event instanceof NavigationEnd) {
            this.isHomeView.set(event.url === '/');
          }
        });
      },
      {
        allowSignalWrites: true
      }
    );
  }

  onChangeProject(projectSlug: string) {
    this.selectedProject.set(projectSlug);
    this.changeProject.emit(projectSlug);
  }

  toggleSearch() {
    this.isSearchVisible.update((value) => !value);
  }

  closeSearch() {
    this.isSearchVisible.set(false);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.metadataSourceService.setFilterSignal(filterValue);
  }
}
