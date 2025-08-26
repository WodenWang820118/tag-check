import { Spec } from '../tag-check';

export type NestedObject = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type ParameterMap = {
  type: string;
  map: Parameter[];
};

export type Parameter = {
  type: string;
  // Some parameter objects (e.g. TRIGGER_REFERENCE list items) don't carry a key
  key?: string;
  value?: string;
  // In GTM exports, list items can be either MAPs with nested parameters or
  // simple references like TRIGGER_REFERENCE items with just a value.
  list?: Array<
    | ParameterMap
    | {
        type: string;
        value?: string;
        map?: Parameter[];
      }
  >;
};

export type CustomEventFilter = {
  type: string;
  parameter: Parameter[];
};

export type GTMContainerConfig = {
  accountId: string;
  containerId: string;
  containerName: string;
  gtmId: string;
  specs: Spec[];
};

export type DataRow = {
  [key: string]: string;
};

export type DataLayer = {
  event: string;
  paths: string[];
};
