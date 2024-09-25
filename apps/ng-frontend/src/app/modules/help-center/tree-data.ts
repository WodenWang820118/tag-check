import { TopicNode } from '@utils';

export const TREE_DATA: TopicNode[] = [
  { name: 'Help Center', id: 1 },
  {
    name: 'Get Started',
    id: -1,
    children: [
      { name: 'Objective', id: 2 },
      { name: 'Use Cases', id: 3 },
      { name: 'Getting Started', id: 4 },
    ],
  },
  {
    name: 'Projects',
    id: -1,
    children: [
      { name: 'Quality Assurance', id: 5 },
      { name: 'Report Management', id: 6 },
    ],
  },
  {
    name: 'Settings',
    id: -1,
    children: [{ name: 'setting-details', id: 7 }],
  },
];
