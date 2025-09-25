export type FixtureRow = Record<string, unknown>;

export interface FixtureEnvelopeV1 {
  version: 1;
  exportedAt: string;
  schemaHash: string;
  projectSlug: string;
  entities: Record<string, FixtureRow[]>;
}

export type AnyFixtureEnvelope = FixtureEnvelopeV1; // Future union placeholder
