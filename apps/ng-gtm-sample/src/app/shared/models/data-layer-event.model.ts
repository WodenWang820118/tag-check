export interface DataLayerEvent {
  id?: string;
  eventName: string;
  eventData: Record<string, unknown>;
  timestamp: number;
}

/** One object pushed to `window.dataLayer`. */
export type DataLayerEntry = Record<string, unknown>;

/** `globalThis` once the GTM snippet has created `window.dataLayer`. */
export interface DataLayerGlobal {
  dataLayer: DataLayerEntry[];
}
