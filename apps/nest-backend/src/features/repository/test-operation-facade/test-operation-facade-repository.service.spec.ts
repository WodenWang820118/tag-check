import { describe, expect, it } from 'vitest';
import { TestOperationFacadeRepositoryService } from './test-operation-facade-repository.service';

describe('TestOperationFacadeRepositoryService', () => {
  it('can be instantiated with the three repository services', () => {
    const service = new TestOperationFacadeRepositoryService(
      {} as never,
      {} as never,
      {} as never
    );
    expect(service).toBeInstanceOf(TestOperationFacadeRepositoryService);
  });
});
