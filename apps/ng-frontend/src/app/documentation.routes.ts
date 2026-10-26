import { SecurityContext } from '@angular/core';
import { Routes } from '@angular/router';
import { provideMarkdown, SANITIZE } from 'ngx-markdown';

/**
 * The documentation pages with the Markdown renderer they need. Providing it
 * here rather than in appConfig keeps ngx-markdown and marked out of the
 * initial bundle: only these lazily loaded pages render Markdown.
 */
export const DOCUMENTATION_ROUTES: Routes = [
  {
    path: '',
    providers: [
      provideMarkdown({
        sanitize: {
          provide: SANITIZE,
          useValue: SecurityContext.NONE
        }
      })
    ],
    loadChildren: () => import('@ui').then((m) => m.DOCS_ROUTES)
  }
];
