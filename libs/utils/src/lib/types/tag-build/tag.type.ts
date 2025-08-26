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
  type: string;
  accountId: string;
  containerId: string;
  parameter: Parameter[];
  fingerprint?: string;
  // Present on most tags, but not strictly required (e.g., some config tags)
  firingTriggerId?: string[];
  tagFiringOption?: string;
  // Optional additional metadata fields seen in exports
  notes?: string;
  priority?: {
    type: string;
    value: string;
  };
  monitoringMetadata?: {
    // GTM exports provide a MAP here, but the runtime object often widens to string
    type: string;
  };
  // Consent settings vary by template; keep flexible to match raw export objects
  consentSettings?: {
    consentStatus: string;
    consentType?: {
      type: string;
      list: Array<{
        type: string;
        value: string;
      }>;
    };
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
