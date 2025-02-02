import { Auditable } from './auditable.type';
import { StrictDataLayerEvent, BaseDataLayerEvent } from './data-layer.type';

export type ProjectSpec = {
  projectSlug: string;
  specs: Spec[];
};

export type Spec = {
  event: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type SpecSchema = {
  id: number;
} & Spec &
  Auditable;

export type DataLayerSpec = {
  eventName: string;
  dataLayerSpec: StrictDataLayerEvent | BaseDataLayerEvent;
};

export type DataLayerSpecSchema = {
  id: number;
} & DataLayerSpec &
  Auditable;
