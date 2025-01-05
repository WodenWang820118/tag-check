import { VariableTypeEnum } from '../../enums/tag-build';
import { Parameter } from './common.type';

export type VariableConfig = {
  name: string;
  type: VariableTypeEnum;
  accountId: string;
  containerId: string;
  parameter?: Parameter[];
  formatValue?: object;
  variableId?: string;
  fingerprint?: string;
};

export type ConstantVariableConfig = {
  type: VariableTypeEnum.CONSTANT;
} & Omit<VariableConfig, 'type'>;

export type DataLayerVariableConfig = {
  type: VariableTypeEnum.DATA_LAYER;
} & Omit<VariableConfig, 'type'>;

export type RegexVariableConfig = {
  type: VariableTypeEnum.REGEX;
} & Omit<VariableConfig, 'type'>;

export type EventSettingsVariableConfig = {
  type: VariableTypeEnum.EVENT_SETTINGS;
} & Omit<VariableConfig, 'type'>;

export type ScrollVariableConfig = {
  type: VariableTypeEnum.SCROLL_DEPTH_THRESHOLD;
} & Omit<VariableConfig, 'type'>;

export type VideoVariableConfig = {
  type:
    | VariableTypeEnum.VIDEO_PROVIDER
    | VariableTypeEnum.VIDEO_URL
    | VariableTypeEnum.VIDEO_TITLE
    | VariableTypeEnum.VIDEO_DURATION
    | VariableTypeEnum.VIDEO_PERCENT
    | VariableTypeEnum.VIDEO_VISIBLE
    | VariableTypeEnum.VIDEO_STATUS
    | VariableTypeEnum.VIDEO_CURRENT_TIME;
} & Omit<VariableConfig, 'type'>;

export type EventSettingsVariable = {
  name: string;
  parameters: { [x: string]: string }[];
};
