/**
 * App-wide settings of AI assist: a model on this computer, served by
 * Ollama, suggests replacements for a step's selectors when none of them
 * matches any more. The settings apply to every project.
 */
export type AiAssistSettings = {
  /** Off by default. */
  enabled: boolean;
  /** Ollama's address, on this computer only (localhost, 127.0.0.1, [::1]). */
  ollamaUrl: string;
  /** The Ollama model to ask, such as `qwen3.5:9b`. */
  model: string;
};

/** Body of PUT /ai-assist: the settings to change; the others keep their value. */
export type AiAssistSettingsRequest = Partial<AiAssistSettings>;

/**
 * Whether the model can be asked. TagCheck never starts Ollama or downloads
 * a model itself: it shows the command to run instead.
 */
export type AiAssistReadiness =
  /** Ollama did not answer at the settings' address. */
  | { kind: 'runtimeUnavailable' }
  /** Ollama answered but does not have the model. */
  | {
      kind: 'modelMissing';
      /** Ollama's version. */
      version: string;
      /** The models Ollama has, by name. */
      models: string[];
      /** The terminal command that downloads the model. */
      command: string;
    }
  | { kind: 'ready'; version: string; models: string[] };

/** What GET and PUT /ai-assist return. */
export type AiAssistResponse = {
  settings: AiAssistSettings;
  readiness: AiAssistReadiness;
};
