import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateTestImageDto,
  TestImageEntity,
  UpdateTestImageDto
} from '../../../shared';

@Injectable()
export class TestImageRepositoryService {
  constructor(
    @InjectRepository(TestImageEntity)
    private readonly repository: Repository<TestImageEntity>
  ) {}

  async get(id: number) {
    return this.repository.findOne({ where: { id } });
  }

  async create(data: CreateTestImageDto) {
    return this.repository.save(data);
  }

  async update(data: UpdateTestImageDto) {
    return this.repository.save(data);
  }
}
