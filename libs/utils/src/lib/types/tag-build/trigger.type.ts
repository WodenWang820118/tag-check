import { TriggerTypeEnum } from '../../enums/tag-build';
import { CustomEventFilter, Parameter } from './common.type';

export type Trigger = {
  name: string;
  triggerId: string;
};

export type TriggerConfig = {
  name: string;
  type: TriggerTypeEnum;
  accountId: string;
  containerId: string;
  triggerId?: string;
  firingTriggerId?: string[];
  fingerprint?: string;
  customEventFilter?: CustomEventFilter[];
  parameter?: Parameter[];
};

export type CustomEventTriggerConfig = {
  type: TriggerTypeEnum.CUSTOM_EVENT;
} & Omit<TriggerConfig, 'type'>;

export type ScrollDepthTriggerConfig = {
  type: TriggerTypeEnum.SCROLL_DEPTH;
} & Omit<TriggerConfig, 'type'>;

export type YouTubeVideoTriggerConfig = {
  type: TriggerTypeEnum.YOU_TUBE_VIDEO;
} & Omit<TriggerConfig, 'type'>;
