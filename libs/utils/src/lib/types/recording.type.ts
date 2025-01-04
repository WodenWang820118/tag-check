export type ProjectRecording = {
  projectSlug: string;
  recordings: Record<string, Recording>;
};

export type Recording = {
  title: string;
  steps: Record<string, any>[];
};
