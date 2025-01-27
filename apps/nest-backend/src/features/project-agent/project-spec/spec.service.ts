import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SpecEntity } from '../../../shared';
import { Repository } from 'typeorm';
import { CreateSpecDto } from '../../../shared';
import { UpdateSpecDto } from '../../../shared';

@Injectable()
export class SpecService {
  constructor(
    @InjectRepository(SpecEntity)
    private readonly specRepository: Repository<SpecEntity>
  ) {}

  async getSpecs(): Promise<SpecEntity[]> {
    return await this.specRepository.find();
  }

  async getSpecById(id: number) {
    return await this.specRepository.findOne({
      where: { id: id }
    });
  }

  async getSpecByEvent(event: string) {
    return await this.specRepository.findOne({
      where: { event: event }
    });
  }

  async addSpec(createSpecDto: CreateSpecDto): Promise<SpecEntity> {
    const spec = this.specRepository.create(createSpecDto);
    return this.specRepository.save(spec);
  }

  async updateSpec(id: number, updateSpecDto: UpdateSpecDto) {
    await this.specRepository.update(id, updateSpecDto);
    return this.getSpecById(id);
  }

  async deleteSpec(id: number): Promise<void> {
    await this.specRepository.delete(id);
  }
}
