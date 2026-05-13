export type NavigationMatchStrategy = 'exact' | 'prefix';

export interface SharedNavigationLink {
  readonly href: string;
  readonly label: string;
  readonly icon: string;
  readonly logicalPath?: string;
  readonly matchStrategy?: NavigationMatchStrategy;
}
