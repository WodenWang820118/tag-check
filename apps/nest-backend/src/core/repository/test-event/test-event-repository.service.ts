import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TestEventEntity,
  CreateTestEventDto,
  UpdateTestEventDto
} from '../../../shared';

@Injectable()
export class TestEventRepositoryService {
  constructor(
    @InjectRepository(TestEventEntity)
    private readonly repository: Repository<TestEventEntity>
  ) {}

  async get(id: number) {
    return this.repository.findOne({ where: { id } });
  }

  async create(data: CreateTestEventDto) {
    return this.repository.save(data);
  }

  async update(data: UpdateTestEventDto) {
    return this.repository.save(data);
  }
}
