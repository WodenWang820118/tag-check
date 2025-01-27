import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestDataLayerEntity } from '../../../shared';

@Injectable()
export class TestDataLayerRepositoryService {
  constructor(
    @InjectRepository(TestDataLayerEntity)
    private readonly repository: Repository<TestDataLayerEntity>
  ) {}
}
