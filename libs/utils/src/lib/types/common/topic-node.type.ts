export type TopicNode = {
  id: number;
  name: string;
  children?: TopicNode[];
  isExpanded?: boolean;
  route?: string;
};
