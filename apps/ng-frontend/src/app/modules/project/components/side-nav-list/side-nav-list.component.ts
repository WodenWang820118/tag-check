import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { NgIf } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, Subject, takeUntil, tap } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { OverlayComponent } from '../overlay/overlay.component';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenav } from '@angular/material/sidenav';

@Component({
  selector: 'app-side-nav-list',
  standalone: true,
  imports: [
    NgIf,
    MatListModule,
    MatIconModule,
    RouterLink,
    MatMenuModule,
    OverlayModule,
    OverlayComponent,
    MatButtonModule,
  ],
  templateUrl: './side-nav-list.component.html',
  styleUrls: ['./side-nav-list.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SideNavListComponent implements OnInit, OnDestroy {
  @Input() snav!: MatSidenav;
  @Output() menuClick = new EventEmitter();
  items: {
    icon: string;
    title: string;
    link: string;
    subTitle?: string;
  }[] = [];

  isOpen = false;
  destroy$ = new Subject<void>();
  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        tap((params) => {
          this.items = []; // reset items
          const projectSlug = params['projectSlug'];
          this.items.push({
            icon: 'home',
            title: 'Tests',
            link: `./`,
            subTitle: projectSlug,
          });

          this.items.push({
            icon: 'build',
            title: 'TagBuild',
            link: `tag-build`,
          });

          this.items.push({
            icon: 'folder_shared',
            title: 'Reports',
            link: `buckets`,
          });

          this.items.push({
            icon: 'settings',
            title: 'Settings',
            link: `settings`,
          });
        })
      )
      .subscribe();

    this.snav.openedChange
      .pipe(
        takeUntil(this.destroy$),
        tap((isOpen) => {
          if (isOpen === false) {
            this.isOpen = false;
          }
        }),
        catchError((error) => {
          console.error('Error: ', error);
          return error;
        })
      )
      .subscribe();
  }

  onMenuClick() {
    this.menuClick.emit();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
