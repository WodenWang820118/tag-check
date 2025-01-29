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

  async list(id: number) {
    return this.repository.find({ where: { id } });
  }

  async get(id: number) {
    return this.repository.findOne({ where: { id } });
  }

  async getByEventId(eventId: string) {
    return this.repository.findOne({ where: { eventId } });
  }

  async create(data: CreateTestEventDto) {
    return this.repository.save(data);
  }

  async update(data: UpdateTestEventDto) {
    return this.repository.save(data);
  }

  async delete(eventId: string) {
    return this.repository.delete(eventId);
  }

  async deleteMany(eventIds: string[]) {
    return this.repository.delete(eventIds);
  }
}
