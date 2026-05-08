import { describe, expect, it, vi } from 'vitest';
import { StartupReadinessController } from './startup-readiness.controller';

describe('StartupReadinessController', () => {
  it('delegates getProjectSeedReadiness to the repository service', () => {
    const readiness = {
      ready: true,
      projectCount: 3,
      inFlight: false,
      error: null
    };
    const exampleProjectRepositoryService = {
      getStartupSeedReadiness: vi.fn().mockReturnValue(readiness)
    };
    const controller = new StartupReadinessController(
      exampleProjectRepositoryService as never
    );

    const result = controller.getProjectSeedReadiness();

    expect(
      exampleProjectRepositoryService.getStartupSeedReadiness
    ).toHaveBeenCalledTimes(1);
    expect(result).toBe(readiness);
  });
});
