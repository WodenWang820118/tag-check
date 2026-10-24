import { Controller, Get } from '@nestjs/common';

/** Liveness probe: answers 200 while the backend runs. */
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      message: 'Backend is up and running'
    };
  }
}
