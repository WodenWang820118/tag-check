import { Module } from '@nestjs/common';
import { OsModule } from '../../infrastructure/os/os.module';
import { AiAssistService } from './ai-assist.service';

/** AI assist: a model on this computer, served by Ollama. */
@Module({
  imports: [OsModule],
  providers: [AiAssistService],
  exports: [AiAssistService]
})
export class AiAssistModule {}
