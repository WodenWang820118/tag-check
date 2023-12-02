export interface NestedObject {
  [key: string]: any;
}

export interface ParameterMap {
  type: string;
  map: Parameter[];
}

export interface Parameter {
  type: string;
  key: string;
  value?: string;
  list?: ParameterMap[];
}

export interface CustomEventFilter {
  type: string;
  parameter: Parameter[];
}

export interface Trigger {
  name: string;
  triggerId: string;
}

export interface TriggerConfig {
  name: string;
  type: string;
  accountId: string;
  containerId: string;
  triggerId?: string;
  firingTriggerId?: string[];
  fingerprint?: string;
  customEventFilter?: CustomEventFilter[];
  parameter?: Parameter[];
}

export interface Tag {
  name: string;
  triggers: Trigger[];
  parameters: Parameter[];
}

export interface TagConfig {
  name: string;
  type: string;
  accountId: string;
  containerId: string;
  parameter: Parameter[];
  fingerprint?: string;
  firingTriggerId: string[];
}

export interface VariableConfig {
  name: string;
  type: string;
  accountId: string;
  containerId: string;
  parameter?: Parameter[];
  formatValue?: {};
  variableId?: string;
  fingerprint?: string;
}

export interface GtmConfigGenerator {
  accountId: string;
  containerId: string;
  containerName: string;
  gtmId: string;
  specs: string;
}

export interface DataRow {
  [key: string]: string;
}
