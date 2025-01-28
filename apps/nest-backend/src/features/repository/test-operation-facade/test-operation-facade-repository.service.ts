import { TestDataLayerRepositoryService } from '../../../core/repository/test-event/test-data-layer-repository.service';
import { TestEventRepositoryService } from '../../../core/repository/test-event/test-event-repository.service';
import { Injectable } from '@nestjs/common';
import { TestImageRepositoryService } from '../../../core/repository/test-event/test-image-repository.service';
import { TestInfoRepositoryService } from '../../../core/repository/test-event/test-info-repository.service';
import { TestRequestInfoRepositoryService } from '../../../core/repository/test-event/test-request-info-repository.service';

@Injectable()
export class TestOperationFacadeRepositoryService {
  constructor(
    private testEventRepositoryService: TestEventRepositoryService,
    private testDataLayerRepositoryService: TestDataLayerRepositoryService,
    private testImageRepositoryService: TestImageRepositoryService,
    private testInfoRepositoryService: TestInfoRepositoryService,
    private testRequestInfoRepositoryService: TestRequestInfoRepositoryService
  ) {}
}
