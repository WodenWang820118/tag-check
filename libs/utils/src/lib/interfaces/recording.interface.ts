export interface ProjectRecording {
  projectSlug: string;
  recordings: Record<string, Recording>;
}

export interface Recording {
  title: string;
  steps: Record<string, any>[];
}
