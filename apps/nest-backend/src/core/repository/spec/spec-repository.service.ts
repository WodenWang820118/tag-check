import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpecEntity } from '../../../shared';

@Injectable()
export class SpecRepositoryService {
  constructor(
    @InjectRepository(SpecEntity)
    private readonly repository: Repository<SpecEntity>
  ) {}
}
