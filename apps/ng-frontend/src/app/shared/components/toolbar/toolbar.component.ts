import { MatFormFieldModule } from '@angular/material/form-field';
import { ProjectInfo, Setting } from '@utils';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { NgIf } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenav } from '@angular/material/sidenav';
import { MatSelectModule } from '@angular/material/select';
import {
  MatButtonToggleChange,
  MatButtonToggleModule,
} from '@angular/material/button-toggle';
import { MetadataSourceService } from '../../services/metadata-source/metadata-source.service';
import { MatInputModule } from '@angular/material/input';
import { tap } from 'rxjs';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [
    NgIf,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    RouterLink,
    MatMenuModule,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonToggleModule,
    MatInputModule,
  ],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ToolbarComponent implements AfterViewInit {
  @Input() settings!: Setting | undefined;
  @Input() snav!: MatSidenav | undefined;
  @Input() projects!: ProjectInfo[] | null;
  @Output() changeProject = new EventEmitter<string>();
  isSearchVisible = false;
  isHomeView = false;

  constructor(
    private metadataSourceService: MetadataSourceService,
    private router: Router
  ) {}

  onChangeProject(projectSlug: string) {
    this.changeProject.emit(projectSlug);
  }

  onToggleChange(event: MatButtonToggleChange) {
    // console.log(event.value);
    if (event.value === 'search') {
      this.isSearchVisible = !this.isSearchVisible;
    }
  }

  closeSearch() {
    this.isSearchVisible = false;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.metadataSourceService.setFilter(filterValue);
  }

  ngAfterViewInit() {
    this.router.events
      .pipe(
        tap((event) => {
          if (event instanceof NavigationEnd) {
            if (this.router.url === '/') {
              this.isHomeView = true;
            } else {
              this.isHomeView = false;
            }
          }
        })
      )
      .subscribe();
  }
}
