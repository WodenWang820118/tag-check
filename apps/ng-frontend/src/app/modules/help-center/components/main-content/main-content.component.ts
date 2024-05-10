import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, tap } from 'rxjs';
import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'app-contents',
  standalone: true,
  imports: [MarkdownModule],
  template: `
    <div class="main-content">
      <markdown [src]="fileName"></markdown>
    </div>
  `,
  styles: [
    `
      .main-content {
        padding: 0 15rem;
      }
    `,
  ],
})
export class MainContentComponent implements OnInit, OnDestroy {
  destroy$ = new Subject<void>();
  fileName: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.params
      .pipe(
        tap((param) => {
          const name = param['name'].toLowerCase();
          this.fileName = `assets/markdown/${name}.md`;
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
