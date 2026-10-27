import { Module } from '@nestjs/common';
import { OsModule } from '../../infrastructure/os/os.module';
import { TestRunModule } from '../test-run/test-run.module';
import { AiAssistService } from './ai-assist.service';
import { SelectorSuggestionService } from './selector-suggestion.service';
import { SelectorTrialService } from './selector-trial.service';
import { StepFailureService } from './step-failure.service';

const services = [
  AiAssistService,
  StepFailureService,
  SelectorSuggestionService,
  SelectorTrialService
];

/**
 * AI assist: a model on this computer, served by Ollama, suggests
 * replacements for a step that could not find its element, from what the
 * step saw; a trial run tries one before the recording changes.
 */
@Module({
  imports: [OsModule, TestRunModule],
  providers: [...services],
  exports: [...services]
})
export class AiAssistModule {}
