import {
  BadGatewayException,
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException
} from '@nestjs/common';
import { rankCandidates, type SelectorSuggestionsResponse } from '@utils';
import {
  OllamaChatError,
  OllamaClientService
} from '../../infrastructure/ollama/ollama-client.service';
import { AiAssistService } from './ai-assist.service';
import {
  buildSuggestionMessages,
  CANDIDATES_ASKED,
  readSuggestionAnswer,
  SUGGESTION_FORMAT
} from './selector-prompt';
import { StepFailureService } from './step-failure.service';

/**
 * Asks the local model which page elements a failed step meant. The model
 * reads the likeliest CANDIDATES_ASKED candidates the run recorded and
 * answers with their ids; each suggestion's selectors come from the run,
 * never from the model.
 */
@Injectable()
export class SelectorSuggestionService {
  private readonly logger = new Logger(SelectorSuggestionService.name);

  constructor(
    private readonly aiAssist: AiAssistService,
    private readonly stepFailures: StepFailureService,
    private readonly ollama: OllamaClientService
  ) {}

  /**
   * Suggestions for run `runId`'s failed step (the latest run by default).
   *
   * @throws ConflictException when AI assist is off.
   * @throws ServiceUnavailableException when Ollama or the model is missing.
   * @throws NotFoundException when the run kept no failed step.
   * @throws BadGatewayException when the model gave no usable answer.
   */
  async suggest(
    projectSlug: string,
    eventId: string,
    runId?: number
  ): Promise<SelectorSuggestionsResponse> {
    const { settings, readiness } = await this.aiAssist.getState();
    if (!settings.enabled) {
      throw new ConflictException(
        'AI assist is off. Turn it on in Settings > AI Assist.'
      );
    }
    if (readiness.kind === 'runtimeUnavailable') {
      throw new ServiceUnavailableException('Ollama is not running.');
    }
    if (readiness.kind === 'modelMissing') {
      throw new ServiceUnavailableException(
        `${settings.model} is not downloaded. Run: ${readiness.command}`
      );
    }
    const context = await this.stepFailures.get(projectSlug, eventId, runId);
    const candidates = rankCandidates(context, CANDIDATES_ASKED);
    const response: SelectorSuggestionsResponse = {
      stepIndex: context.stepIndex,
      stepType: context.stepType,
      model: settings.model,
      considered: candidates.length,
      suggestions: []
    };
    if (candidates.length === 0) {
      return response;
    }

    let answer: string;
    try {
      answer = await this.ollama.chat(settings.ollamaUrl, {
        model: settings.model,
        messages: buildSuggestionMessages(context, candidates),
        format: SUGGESTION_FORMAT
      });
    } catch (error) {
      if (error instanceof OllamaChatError) {
        throw new BadGatewayException(error.message);
      }
      throw error;
    }
    const picks = readSuggestionAnswer(answer, candidates);
    if (picks === null) {
      this.logger.warn(`Unusable answer from ${settings.model}`);
      throw new BadGatewayException(
        'The model did not answer with the requested JSON. Try again.'
      );
    }
    return { ...response, suggestions: picks };
  }
}
