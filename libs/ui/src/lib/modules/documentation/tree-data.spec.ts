import { describe, expect, it } from 'vitest';
import { DOCUMENTATION_PAGES, DOCUMENTATION_ROUTE_SLUGS } from './tree-data';

describe('documentation tree data', () => {
  it('flattens the known leaf pages into prerenderable documentation routes', () => {
    expect(DOCUMENTATION_PAGES).toEqual([
      { slug: 'introduction', label: 'Introduction' },
      { slug: 'objective', label: 'Objective' },
      { slug: 'use-cases', label: 'Use Cases' },
      { slug: 'getting-started', label: 'Getting Started' },
      { slug: 'quality-assurance', label: 'Quality Assurance' },
      { slug: 'report-management', label: 'Report Management' },
      { slug: 'setting-details', label: 'Setting Details' }
    ]);
    expect(DOCUMENTATION_ROUTE_SLUGS).toEqual([
      'introduction',
      'objective',
      'use-cases',
      'getting-started',
      'quality-assurance',
      'report-management',
      'setting-details'
    ]);
  });
});
