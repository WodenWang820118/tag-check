import { Auditable } from './auditable.type';

export type ProjectRecording = {
  projectSlug: string;
  recordings: Record<string, Recording>;
};

export type Recording = {
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  steps: Record<string, any>[];
};

export type RecordingSchema = {
  id: number;
} & Recording &
  Auditable;
