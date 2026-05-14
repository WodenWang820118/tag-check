import { Auditable } from './auditable.type';
import { Step } from './action.type';

export type ProjectRecording = {
  projectSlug: string;
  recordings: Record<string, Recording>;
};

export type Recording = {
  title: string;
  steps: Step[];
};

export type RecordingSchema = {
  id: number;
} & Recording &
  Auditable;
