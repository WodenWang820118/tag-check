import { TestEventRepositoryService } from '../../../core/repository/test-event/test-event-repository.service';
import { Injectable } from '@nestjs/common';
import { TestImageRepositoryService } from '../../../core/repository/test-event/test-image-repository.service';
import { TestEventDetailRepositoryService } from '../../../core/repository/test-event/test-event-detail-repository.service';

@Injectable()
export class TestOperationFacadeRepositoryService {
  constructor(
    private readonly testEventRepositoryService: TestEventRepositoryService,
    private readonly testEventDetailRepositoryService: TestEventDetailRepositoryService,
    private readonly testImageRepositoryService: TestImageRepositoryService
  ) {}
}
