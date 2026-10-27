import { Module } from '@nestjs/common';
import { OllamaClientService } from './ollama-client.service';

/** Ollama on this computer; see OllamaClientService. */
@Module({
  providers: [OllamaClientService],
  exports: [OllamaClientService]
})
export class OllamaClientModule {}
