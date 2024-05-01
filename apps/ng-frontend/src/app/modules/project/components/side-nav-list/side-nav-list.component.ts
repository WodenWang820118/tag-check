import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil, tap } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { OverlayModule } from '@angular/cdk/overlay';
import { OverlayComponent } from '../overlay/overlay.component';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenav } from '@angular/material/sidenav';

@Component({
  selector: 'app-side-nav-list',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatIconModule,
    RouterModule,
    MatMenuModule,
    OverlayModule,
    OverlayComponent,
    MatButtonModule,
  ],
  templateUrl: './side-nav-list.component.html',
  styles: `
    .sub-list-item {
      height: 30px !important;
    }

    .sub-list-item .mat-mdc-list-item-title {
      font-size: 14px !important;
    }

    .mat-list-item-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 4rem;
    }

    .spacer {
      flex: 1 1 0;
    }

    .btn-chevron {
      scale: 0.7;
    }
  `,
  encapsulation: ViewEncapsulation.None,
})
export class SideNavListComponent implements OnInit, OnDestroy {
  @Input() snav!: MatSidenav;
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
          const projectSlug = params['projectSlug'];
          this.items.push({
            icon: 'home',
            title: 'Tests',
            link: `./`,
            subTitle: projectSlug,
          });

          this.items.push({
            icon: 'settings',
            title: 'Settings',
            link: `settings`,
          });

          this.items.push({
            icon: 'build',
            title: 'TagBuild',
            link: `tag-build`,
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
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
