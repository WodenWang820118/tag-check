import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ArticleComponent } from './article.component';

describe('ArticleComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArticleComponent]
    }).compileComponents();
  });

  it('creates and renders without error', () => {
    const fixture = TestBed.createComponent(ArticleComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.article')).toBeTruthy();
  });

  it('exposes example data shapes for documentation', () => {
    const fixture = TestBed.createComponent(ArticleComponent);
    const cmp = fixture.componentInstance;
    expect(cmp.exampleInput[0].event).toBe('begin_checkout');
    expect(cmp.exampleEsvInput[0][0].name).toContain('Event Settings');
  });
});
