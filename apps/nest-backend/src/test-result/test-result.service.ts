import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TestResult } from './entity/test-result.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TestResultService {
  constructor(
    @InjectRepository(TestResult)
    private readonly testResultRepository: Repository<TestResult>
  ) {}

  async list() {
    return await this.testResultRepository.find();
  }

  async get(projectSlug: string, eventId: string) {
    return await this.testResultRepository.findOne({
      where: { projectSlug, eventId }
    });
  }

  async create(testResultDto: Partial<TestResult>) {
    Logger.log('Writing test result to database');
    const testResult = this.testResultRepository.create(testResultDto);
    return await this.testResultRepository.save(testResult);
  }

  async delete(projectSlug: string, eventId: string) {
    return await this.testResultRepository.delete({ projectSlug, eventId });
  }
}
