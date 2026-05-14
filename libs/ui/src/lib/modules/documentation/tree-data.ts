import { TopicNode } from '@utils';

export interface DocumentationPage {
  readonly slug: string;
  readonly label: string;
}

export const TREE_DATA: TopicNode[] = [
  {
    name: $localize`:@@docs.sidebar.introduction:Introduction`,
    id: 1,
    route: 'introduction'
  },
  {
    name: $localize`:@@docs.sidebar.section.getStarted:Get Started`,
    id: 100,
    isExpanded: false,
    children: [
      {
        name: $localize`:@@docs.sidebar.objective:Objective`,
        id: 2,
        route: 'objective'
      },
      {
        name: $localize`:@@docs.sidebar.useCases:Use Cases`,
        id: 3,
        route: 'use-cases'
      },
      {
        name: $localize`:@@docs.sidebar.gettingStarted:Getting Started`,
        id: 4,
        route: 'getting-started'
      }
    ]
  },
  {
    name: $localize`:@@docs.sidebar.section.projects:Projects`,
    id: 200,
    isExpanded: false,
    children: [
      {
        name: $localize`:@@docs.sidebar.qualityAssurance:Quality Assurance`,
        id: 5,
        route: 'quality-assurance'
      },
      {
        name: $localize`:@@docs.sidebar.reportManagement:Report Management`,
        id: 6,
        route: 'report-management'
      }
    ]
  },
  {
    name: $localize`:@@docs.sidebar.section.settings:Settings`,
    id: 300,
    isExpanded: false,
    children: [
      {
        name: $localize`:@@docs.sidebar.settingDetails:Setting Details`,
        id: 7,
        route: 'setting-details'
      }
    ]
  }
];

function collectDocumentationPages(nodes: TopicNode[]): DocumentationPage[] {
  return nodes.flatMap((node) => {
    if (node.route) {
      return [
        {
          slug: node.route,
          label: node.name
        }
      ];
    }

    return collectDocumentationPages(node.children ?? []);
  });
}

export const DOCUMENTATION_PAGES = collectDocumentationPages(TREE_DATA);
export const DOCUMENTATION_ROUTE_SLUGS = DOCUMENTATION_PAGES.map(
  (page) => page.slug
);
