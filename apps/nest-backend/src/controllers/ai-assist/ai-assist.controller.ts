import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import type { AiAssistResponse } from '@utils';
import { AiAssistService } from '../../features/ai-assist/ai-assist.service';

/**
 * AI assist's settings, for every project on this computer, and whether
 * Ollama can serve the chosen model.
 */
@Controller('ai-assist')
export class AiAssistController {
  constructor(private readonly aiAssist: AiAssistService) {}

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
}
