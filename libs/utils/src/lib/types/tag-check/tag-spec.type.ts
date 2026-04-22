import { DataLayerSpec } from './spec.type';

export type TagSpec = DataLayerSpec & {
  event: string;
};
