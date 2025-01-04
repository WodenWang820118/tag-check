export type Step = {
  type: string;
  target: string;
  selectors: string[];
  url: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type OperationFile = {
  steps: Step[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};
