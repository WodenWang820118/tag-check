import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecordingEntity, CreateRecordingDto } from '../../../shared';

@Injectable()
export class RecordingRepositoryService {
  constructor(
    @InjectRepository(RecordingEntity)
    private readonly repository: Repository<RecordingEntity>
  ) {}

  async get(id: number) {
    return this.repository.findOne({ where: { id } });
  }

  async create(data: CreateRecordingDto) {
    return this.repository.save(data);
  }

  async update(id: number, data: CreateRecordingDto) {
    return this.repository.update(id, data);
  }
}
