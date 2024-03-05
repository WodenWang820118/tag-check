import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'app-side-nav-list',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, RouterModule],
  template: `
    <div class="side-nav-list">
      <mat-nav-list>
        @for (item of items; track item.icon) {
        <a
          mat-list-item
          [routerLink]="item.link"
          (mouseover)="switchHover()"
          (mouseout)="switchHover()"
        >
          <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
          <div matListItemTitle [ngClass]="hover ? 'display' : 'hidden'">
            {{ item.title }}
          </div>
          <div matListItemLine [ngClass]="hover ? 'display' : 'hidden'">
            {{ item.subTitle }}
          </div>
        </a>
        }
      </mat-nav-list>
    </div>
  `,
  styles: `
    /* Initial state: hidden */
    .hidden {
      display: none !important; /* Ensures the element takes up no space when not hovered */
    }

    /* Hover state: visible */
    .display {
      display: inline; /* Makes the element take up space and be visible */
      padding-right: 30px;
    }

    /* Adjustments for the list item and side nav list for animation */
    .mdc-list-item {
      padding-left: 5px !important;
      padding-right: 0 !important;
    }

    .mdc-list {
      transition: width 1s ease;
    }
  `,
  encapsulation: ViewEncapsulation.None,
})
export class SideNavListComponent implements OnInit, OnDestroy {
  items: {
    icon: string;
    title: string;
    link: string;
    subTitle?: string;
  }[] = [];
  hover = false;
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
            title: 'Home',
            link: `./`,
            subTitle: projectSlug,
          });

          this.items.push({
            icon: 'settings',
            title: 'Settings',
            link: `settings`,
          });
        })
      )
      .subscribe();
  }

  switchHover() {
    this.hover = !this.hover;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
