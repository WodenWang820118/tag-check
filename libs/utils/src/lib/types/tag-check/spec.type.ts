import { TagConfig, TriggerConfig } from '../tag-build';
import { StrictDataLayerEvent } from './data-layer.type';

export type ProjectSpec = {
  projectSlug: string;
  specs: StrictDataLayerEvent[];
};

/**
 * A GTM tag and the triggers that fire it, as read from a container export.
 * The tag refers to variables by name (`{{DLV - ecommerce.value}}`).
 */
export type Spec = {
  tag: TagConfig;
  trigger: TriggerConfig[];
};

export type DataLayerSpec = {
  eventName: string;
  dataLayerSpec: StrictDataLayerEvent;
  rawGtmTag: Spec;
};

export type ItemDef = {
  templateName: string;
  itemId: string;
  /** A GA4 item, such as { item_id, item_name, price }. */
  fullItemDef: Record<string, unknown>;
};
