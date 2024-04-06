export interface ProjectRecording {
  projectSlug: string;
  recordings: Recording[];
}

export interface Recording {
  title: string;
  steps: any[];
}
