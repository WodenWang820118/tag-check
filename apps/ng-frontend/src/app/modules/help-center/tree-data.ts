export interface TopicNode {
  name: string;
  children?: TopicNode[];
}

export const TREE_DATA: TopicNode[] = [
  {
    name: 'Get Started',
    children: [
      { name: 'Objective' },
      { name: 'Use Cases' },
      { name: 'How it works' },
    ],
  },
  {
    name: 'Projects',
    children: [
      { name: 'Project Creation' },
      { name: 'Helper Center' },
      { name: 'Import and Export' },
    ],
  },
  {
    name: 'Settings',
    children: [
      { name: 'Project Information' },
      { name: 'Authentication' },
      { name: 'Pre-load Data' },
      { name: 'Broswer Auguments' },
      { name: 'Google Tag Manager' },
    ],
  },
];
