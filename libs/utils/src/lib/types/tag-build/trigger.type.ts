import { CustomEventFilter, Parameter } from './common.type';

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
