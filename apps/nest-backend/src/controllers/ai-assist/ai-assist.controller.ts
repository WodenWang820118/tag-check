import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import type { AiAssistResponse, StepFailureContext } from '@utils';
import { AiAssistService } from '../../features/ai-assist/ai-assist.service';
import { StepFailureService } from '../../features/ai-assist/step-failure.service';

/**
 * AI assist's settings, for every project on this computer, whether Ollama
 * can serve the chosen model, and what failed steps saw.
 */
@Controller('ai-assist')
export class AiAssistController {
  constructor(
    private readonly aiAssist: AiAssistService,
    private readonly stepFailures: StepFailureService
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
}
