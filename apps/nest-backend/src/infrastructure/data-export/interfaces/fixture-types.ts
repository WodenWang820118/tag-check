/** One exported row: column and relation properties as JSON values. */
export type FixtureRow = Record<string, unknown>;

/**
 * The JSON fixture of one project, as `<slug>.fixture.json` in an exported
 * zip. `entities` maps an entity name, such as `TestEventEntity`, to its
 * rows; relations hold the related rows' exported IDs.
 */
export interface FixtureEnvelopeV1 {
  version: 1;
  exportedAt: string;
  schemaHash: string;
  projectSlug: string;
  entities: Record<string, FixtureRow[]>;
}
