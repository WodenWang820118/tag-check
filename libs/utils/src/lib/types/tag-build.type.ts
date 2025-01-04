import { Spec } from './spec.type';

export type NestedObject = {
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

export type Trigger = {
  name: string;
  triggerId: string;
};

export type TriggerConfig = {
  name: string;
  type: string;
  accountId: string;
  containerId: string;
  triggerId?: string;
  firingTriggerId?: string[];
  fingerprint?: string;
  customEventFilter?: CustomEventFilter[];
  parameter?: Parameter[];
};

export type Tag = {
  name: string;
  triggers: Trigger[];
  parameters: Parameter[];
};

export type TagConfig = {
  name: string;
  type: string;
  accountId: string;
  containerId: string;
  parameter: Parameter[];
  fingerprint?: string;
  firingTriggerId: string[];
  tagFiringOption: string;
  monitoringMetadata: {
    type: 'MAP';
  };
  consentSettings: {
    consentStatus: 'NOT_SET';
  };
};

export type VariableConfig = {
  name: string;
  type: string;
  accountId: string;
  containerId: string;
  parameter?: Parameter[];
  formatValue?: object;
  variableId?: string;
  fingerprint?: string;
};

export type GtmConfigGenerator = {
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
