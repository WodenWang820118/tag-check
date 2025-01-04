export type ProjectSpec = {
  projectSlug: string;
  specs: Spec[];
};

export type Spec = {
  event: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};
