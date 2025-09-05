import { TagConfig, TriggerConfig } from '../tag-build';
import { Auditable } from './auditable.type';
import { StrictDataLayerEvent } from './data-layer.type';

export type ProjectSpec = {
  projectSlug: string;
  specs: Spec[];
};

/**
 * An individual spec for an event
 * An event corresponds to a tag, which might contains multiple triggers
 * The tag already have reference "name" attribute regarding variables
 */
export type Spec = {
  tag: TagConfig;
  trigger: TriggerConfig[];
};

export type SpecSchema = {
  id: number;
} & Spec &
  Auditable;

export type DataLayerSpec = {
  eventName: string;
  dataLayerSpec: StrictDataLayerEvent;
  rawGtmTag: Spec;
};

export type DataLayerSpecSchema = {
  id: number;
} & DataLayerSpec &
  Auditable;

export type ItemDef = {
  templateName: string;
  itemId: string;
  fullItemDef: any;
};

export type ItemDefSchema = {
  id: number;
} & ItemDef &
  Auditable;
