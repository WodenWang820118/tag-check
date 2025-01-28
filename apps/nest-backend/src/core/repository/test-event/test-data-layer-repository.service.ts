import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateTestDataLayerDto,
  TestDataLayerEntity,
  UpdateTestDataLayerDto
} from '../../../shared';

@Injectable()
export class TestDataLayerRepositoryService {
  constructor(
    @InjectRepository(TestDataLayerEntity)
    private readonly repository: Repository<TestDataLayerEntity>
  ) {}

  async get(id: number) {
    return this.repository.findOne({ where: { id } });
  }

  async create(data: CreateTestDataLayerDto) {
    return this.repository.save(data);
  }

  async update(data: UpdateTestDataLayerDto) {
    return this.repository.save(data);
  }
}
