import { Controller, Get } from '@nestjs/common';
import { ExampleProjectRepositoryService } from '../../features/example-project/example-project-repository.service';
import type { ExampleProjectStartupReadiness } from '../../features/example-project/example-project-repository.service';

@Controller('startup')
export class StartupReadinessController {
  constructor(
    private readonly exampleProjectRepositoryService: ExampleProjectRepositoryService
  ) {}

  @Get('project-seed-readiness')
  getProjectSeedReadiness(): ExampleProjectStartupReadiness {
    return this.exampleProjectRepositoryService.getStartupSeedReadiness();
  }
}
