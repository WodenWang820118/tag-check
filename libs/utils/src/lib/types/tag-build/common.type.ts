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
  key: string;
  value?: string;
  list?: ParameterMap[];
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
