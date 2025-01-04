import { Parameter } from './common.type';

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

export type EventSettingsVariable = {
  name: string;
  parameters: { [x: string]: string }[];
};
