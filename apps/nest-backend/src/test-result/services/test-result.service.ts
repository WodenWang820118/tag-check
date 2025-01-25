import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TestResult } from '../entity/test-result.entity';
import { In, Repository } from 'typeorm';
import { CreateTestResultDto } from '../dto/test-result/create-test-result.dto';

@Injectable()
export class TestResultService {
  constructor(
    @InjectRepository(TestResult)
    private readonly testResultRepository: Repository<TestResult>
  ) {}

  async list(projectSlug: string) {
    return await this.testResultRepository.find({
      where: { projectSlug: projectSlug }
    });
  }

  async get(projectSlug: string, eventId: string) {
    return await this.testResultRepository.findOne({
      where: { projectSlug, eventId }
    });
  }

  async getMany(projectSlug: string, eventIds: string[]) {
    return await this.testResultRepository.find({
      where: { projectSlug, eventId: In(eventIds) }
    });
  }

  async create(testResultDto: Partial<CreateTestResultDto>) {
    const testResult = this.testResultRepository.create(testResultDto);
    return await this.testResultRepository.save(testResult);
  }

  async delete(projectSlug: string, eventId: string) {
    return await this.testResultRepository.delete({ projectSlug, eventId });
  }

  async deleteMany(projectSlug: string, eventIds: string[]) {
    return await this.testResultRepository.delete({
      projectSlug,
      eventId: In(eventIds)
    });
  }
}
