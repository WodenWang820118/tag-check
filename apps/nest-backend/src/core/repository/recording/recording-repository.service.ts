import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecordingEntity } from '../../../shared';

@Injectable()
export class RecordingRepositoryService {
  constructor(
    @InjectRepository(RecordingEntity)
    private readonly repository: Repository<RecordingEntity>
  ) {}
}
