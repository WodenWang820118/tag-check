import { TopicNode } from '@utils';

export const TREE_DATA: TopicNode[] = [
  { name: 'Introduction', id: 1, route: 'introduction' },
  {
    name: 'Get Started',
    id: 100,
    isExpanded: false,
    children: [
      { name: 'Objective', id: 2, route: 'objective' },
      { name: 'Use Cases', id: 3, route: 'use-cases' },
      { name: 'Getting Started', id: 4, route: 'getting-started' }
    ]
  },
  {
    name: 'Projects',
    id: 200,
    isExpanded: false,
    children: [
      { name: 'Quality Assurance', id: 5, route: 'quality-assurance' },
      { name: 'Report Management', id: 6, route: 'report-management' }
    ]
  },
  {
    name: 'Settings',
    id: 300,
    isExpanded: false,
    children: [{ name: 'Setting Details', id: 7, route: 'setting-details' }]
  }
];
