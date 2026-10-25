/**
 * The screen recordings a run writes to its inspection_results/<eventId>
 * folder. Every run replaces them; only accompanied-mode runs write the
 * Tag Assistant one.
 */
export const RECORDING_FILES = {
  site: 'recording.webm',
  tagAssistant: 'recording-tag-assistant.webm'
} as const;

export type RecordingFile =
  (typeof RECORDING_FILES)[keyof typeof RECORDING_FILES];
