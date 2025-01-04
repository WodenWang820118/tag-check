import { Parameter } from './common.type';
import { Trigger } from './trigger.type';

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
