import { Auditable } from './auditable.type';

export type SysConfiguration = {
  name: string;
  value: string;
  description?: string;
};

export type SysConfigurationSchema = {
  id: number;
} & SysConfiguration &
  Auditable;
