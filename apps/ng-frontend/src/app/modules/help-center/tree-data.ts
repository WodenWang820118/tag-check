import { TopicNode } from '@utils';

export const TREE_DATA: TopicNode[] = [
  { name: 'Help Center', id: 1 },
  {
    name: 'Get Started',
    id: -1,
    children: [
      { name: 'Objective', id: 2 },
      { name: 'Use Cases', id: 3 },
      { name: 'How it works', id: 4 },
    ],
  },
  {
    name: 'Projects',
    id: -1,
    children: [
      { name: 'Project Management', id: 5 },
      { name: 'Quality Assurance', id: 6 },
      { name: 'Report Management', id: 7 },
    ],
  },
  {
    name: 'Settings',
    id: -1,
    children: [
      { name: 'Project Information', id: 8 },
      { name: 'Authentication', id: 9 },
      { name: 'Pre-load Data', id: 10 },
      { name: 'Browser Arguments', id: 11 },
      { name: 'Google Tag Manager', id: 12 },
    ],
  },
];
