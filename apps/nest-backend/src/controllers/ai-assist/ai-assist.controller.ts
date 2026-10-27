import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import type {
  AiAssistResponse,
  SelectorSuggestionsResponse,
  SelectorTrialResponse,
  StepFailureContext
} from '@utils';
import { AiAssistService } from '../../features/ai-assist/ai-assist.service';
import { SelectorSuggestionService } from '../../features/ai-assist/selector-suggestion.service';
import { SelectorTrialService } from '../../features/ai-assist/selector-trial.service';
import { StepFailureService } from '../../features/ai-assist/step-failure.service';

/**
 * AI assist's settings, for every project on this computer, whether Ollama
 * can serve the chosen model, what failed steps saw, the model's
 * suggestions for them and trial runs of a suggestion.
 */
@Controller('ai-assist')
export class AiAssistController {
  constructor(
    private readonly aiAssist: AiAssistService,
    private readonly stepFailures: StepFailureService,
    private readonly suggestions: SelectorSuggestionService,
    private readonly trials: SelectorTrialService
  ) {}

  @ApiOperation({
    summary: 'Reads the settings and whether the model can be asked',
    description:
      'readiness.kind is runtimeUnavailable (Ollama did not answer), modelMissing (with the command that downloads the model) or ready. Each call asks Ollama again.'
  })
  @Get()
  async get(): Promise<AiAssistResponse> {
    return await this.aiAssist.getState();
  }

  @ApiOperation({
    summary: 'Changes the settings',
    description:
      'Body: { enabled?, ollamaUrl? (http(s) on localhost, 127.0.0.1 or [::1]), model? }. Fields left out keep their value. 400 with the reason for an invalid body.'
  })
  @Put()
  async update(@Body() body: unknown): Promise<AiAssistResponse> {
    return await this.aiAssist.updateSettings(body);
  }

  @ApiOperation({
    summary: 'Reads what a run saw when a step could not find its element',
    description:
      "The step, how many elements each of its selectors matched, the page, and the visible elements it could have meant, each with selectors that matched only it. Kept beside the run's recordings, so only by a test's latest runs. 404 when the run kept none."
  })
  @ApiParam({ name: 'projectSlug' })
  @ApiParam({ name: 'eventId' })
  @ApiQuery({
    name: 'run',
    required: false,
    description: "The run's id; the latest run by default"
  })
  @Get('step-failures/:projectSlug/:eventId')
  async getStepFailure(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string,
    @Query('run', new ParseIntPipe({ optional: true })) run?: number
  ): Promise<StepFailureContext> {
    return await this.stepFailures.get(projectSlug, eventId, run);
  }

  @ApiOperation({
    summary: "Asks the local model which elements a run's failed step meant",
    description:
      "Up to 3 suggestions, best first, each a candidate the run recorded (with selectors that matched only it) and the model's reason. 409 when AI assist is off, 503 when Ollama or the model is missing, 404 when the run kept no failed step, 502 when the model gave no usable answer."
  })
  @ApiParam({ name: 'projectSlug' })
  @ApiParam({ name: 'eventId' })
  @ApiQuery({
    name: 'run',
    required: false,
    description: "The run's id; the latest run by default"
  })
  @Post('suggestions/:projectSlug/:eventId')
  async suggest(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string,
    @Query('run', new ParseIntPipe({ optional: true })) run?: number
  ): Promise<SelectorSuggestionsResponse> {
    return await this.suggestions.suggest(projectSlug, eventId, run);
  }

  @ApiOperation({
    summary: 'Runs the test with other selectors for one step',
    description:
      'Body: { stepIndex (0-based), selectors: 1 to 5 }. A headless run in which that step tries these selectors instead of its own; the recording does not change. Resolves with the saved run once it has run. 400 for an invalid body or a step without selectors.'
  })
  @ApiParam({ name: 'projectSlug' })
  @ApiParam({ name: 'eventId' })
  @Post('trials/:projectSlug/:eventId')
  async trial(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string,
    @Body() body: unknown
  ): Promise<SelectorTrialResponse> {
    return await this.trials.run(projectSlug, eventId, body);
  }
}
