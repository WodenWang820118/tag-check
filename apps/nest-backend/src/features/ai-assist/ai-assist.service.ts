import { BadRequestException, Injectable } from '@nestjs/common';
import {
  DEFAULT_AI_ASSIST_SETTINGS,
  hasOllamaModel,
  isOllamaModelName,
  normalizeOllamaUrl,
  ollamaPullCommand,
  validateAiAssistSettings,
  type AiAssistReadiness,
  type AiAssistResponse,
  type AiAssistSettings
} from '@utils';
import { SysConfigurationRepositoryService } from '../../core/repository/sys-configuration/sys-configuration-repository.service';
import { OllamaClientService } from '../../infrastructure/ollama/ollama-client.service';

/** The system configuration entries that hold the settings. */
export const AI_ASSIST_SETTING_NAMES: Readonly<
  Record<keyof AiAssistSettings, string>
> = {
  enabled: 'aiAssist.enabled',
  ollamaUrl: 'aiAssist.ollamaUrl',
  model: 'aiAssist.model'
};

const DESCRIPTIONS: Readonly<Record<keyof AiAssistSettings, string>> = {
  enabled: 'AI assist: suggest replacements for selectors that fail',
  ollamaUrl: "AI assist: Ollama's address on this computer",
  model: 'AI assist: the Ollama model to ask'
};

/**
 * AI assist's app-wide settings, kept as system configuration entries, and
 * whether Ollama on this computer can serve the chosen model.
 */
@Injectable()
export class AiAssistService {
  constructor(
    private readonly configurations: SysConfigurationRepositoryService,
    private readonly ollama: OllamaClientService
  ) {}

  /** The settings; a missing or unreadable entry has its default. */
  async getSettings(): Promise<AiAssistSettings> {
    const [enabled, ollamaUrl, model] = await Promise.all([
      this.configurations.getValue(AI_ASSIST_SETTING_NAMES.enabled),
      this.configurations.getValue(AI_ASSIST_SETTING_NAMES.ollamaUrl),
      this.configurations.getValue(AI_ASSIST_SETTING_NAMES.model)
    ]);
    return {
      enabled: enabled === 'true',
      ollamaUrl:
        (ollamaUrl && normalizeOllamaUrl(ollamaUrl)) ??
        DEFAULT_AI_ASSIST_SETTINGS.ollamaUrl,
      model:
        model && isOllamaModelName(model)
          ? model
          : DEFAULT_AI_ASSIST_SETTINGS.model
    };
  }

  /** The settings and whether the model can be asked. */
  async getState(): Promise<AiAssistResponse> {
    const settings = await this.getSettings();
    return { settings, readiness: await this.readiness(settings) };
  }

  /**
   * Saves the fields `body` gives; the others keep their value.
   *
   * @throws BadRequestException with the reason when a field is invalid.
   */
  async updateSettings(body: unknown): Promise<AiAssistResponse> {
    const validation = validateAiAssistSettings(body);
    if (!validation.ok) {
      throw new BadRequestException(validation.error);
    }
    const { settings } = validation;
    for (const key of Object.keys(AI_ASSIST_SETTING_NAMES) as Array<
      keyof AiAssistSettings
    >) {
      const value = settings[key];
      if (value !== undefined) {
        await this.configurations.setValue(
          AI_ASSIST_SETTING_NAMES[key],
          String(value),
          DESCRIPTIONS[key]
        );
      }
    }
    return await this.getState();
  }

  private async readiness(
    settings: AiAssistSettings
  ): Promise<AiAssistReadiness> {
    const version = await this.ollama.version(settings.ollamaUrl);
    const models =
      version === null ? null : await this.ollama.models(settings.ollamaUrl);
    if (version === null || models === null) {
      return { kind: 'runtimeUnavailable' };
    }
    if (hasOllamaModel(models, settings.model)) {
      return { kind: 'ready', version, models };
    }
    return {
      kind: 'modelMissing',
      version,
      models,
      command: ollamaPullCommand(settings.model)
    };
  }
}
