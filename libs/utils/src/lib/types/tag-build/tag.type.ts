import { TagTypeEnum } from '../../enums/tag-build';
import { Parameter } from './common.type';
import { Trigger } from './trigger.type';

export type Tag = {
  name: string;
  triggers: Trigger[];
  parameters: Parameter[];
};

export type TagConfig = {
  name: string;
  type: TagTypeEnum;
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

export type EventTagConfig = {
  type: TagTypeEnum.GAAWE;
} & Omit<TagConfig, 'type'>;

export type GoogleTagConfig = {
  type: TagTypeEnum.GOOGLE_TAG;
} & Omit<TagConfig, 'type'>;

export type HTMLTagConfig = {
  type: TagTypeEnum.HTML;
} & Omit<TagConfig, 'type'>;
