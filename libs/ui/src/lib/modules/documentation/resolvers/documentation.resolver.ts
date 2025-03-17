import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { MarkdownService } from 'ngx-markdown';
import { catchError, map, Observable, of } from 'rxjs';
import { TreeNodeService } from '../services/tree-node/tree-node.service';

export const treeNodeResolver: ResolveFn<
  Observable<{
    fileName: string;
    content: string;
  }>
> = (route, state) => {
  const markdownService = inject(MarkdownService);
  const nodeName = route.params['name'];

  // Construct the file path
  const fileName = `assets/markdown/${nodeName}.md`;
  return markdownService.getSource(fileName).pipe(
    catchError((error) => {
      console.error('Error loading markdown file:', error);
      // Fallback to 404.md on error
      return markdownService.getSource('assets/404.md');
    }),
    map((content: string) => {
      if (!content) {
        return {
          fileName: '404.md',
          content: '# 404 Not Found\n\nThe requested page was not found.'
        };
      }
      return {
        fileName: fileName,
        content: content
      };
    })
  );
};
