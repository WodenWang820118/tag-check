import { Module } from '@nestjs/common';
import { OsModule } from '../../infrastructure/os/os.module';
import { AiAssistService } from './ai-assist.service';
import { StepFailureService } from './step-failure.service';

/**
 * AI assist: a model on this computer, served by Ollama, and what failed
 * steps saw, which it suggests replacements from.
 */
@Module({
  imports: [OsModule],
  providers: [AiAssistService, StepFailureService],
  exports: [AiAssistService, StepFailureService]
})
export class AiAssistModule {}
