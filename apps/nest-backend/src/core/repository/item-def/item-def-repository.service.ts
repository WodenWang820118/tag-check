import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateItemDefDto,
  ItemDefEntity,
  ItemDefResponseDto,
  TestEventEntity,
  UpdateItemDefDto
} from '../../../shared';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ItemDefRepositoryService {
  constructor(
    @InjectRepository(ItemDefEntity)
    private readonly repository: Repository<ItemDefEntity>
  ) {}

  async get(id: number) {
    const entity = await this.repository.findOne({ where: { id } });
    return plainToInstance(ItemDefResponseDto, entity);
  }

  async getItemDefById(itemId: string) {
    const entity = await this.repository.findOne({ where: { itemId } });
    return plainToInstance(ItemDefResponseDto, entity);
  }

  async getItemDefByTemplateName(templateName: string) {
    const entity = await this.repository.findOne({ where: { templateName } });
    return plainToInstance(ItemDefResponseDto, entity);
  }

  async list() {
    const entities = await this.repository.find();
    return plainToInstance(ItemDefResponseDto, entities);
  }

  async create(testEventEntity: TestEventEntity, data: CreateItemDefDto) {
    const fullItemDefEntity = new ItemDefEntity();
    fullItemDefEntity.testEvent = testEventEntity;
    fullItemDefEntity.fullItemDef = data.fullItemDef;
    fullItemDefEntity.templateName = data.templateName;
    fullItemDefEntity.itemId = data.itemId;
    await this.repository.save(fullItemDefEntity);
    return plainToInstance(ItemDefResponseDto, fullItemDefEntity);
  }

  async update(id: number, data: UpdateItemDefDto) {
    await this.repository.update(id, data);
    const updatedEntity = await this.repository.findOne({ where: { id } });
    return plainToInstance(ItemDefResponseDto, updatedEntity);
  }

  async updateItemDefById(itemId: string, data: UpdateItemDefDto) {
    await this.repository.update({ itemId }, data);
    const updatedEntity = await this.repository.findOne({ where: { itemId } });
    return plainToInstance(ItemDefResponseDto, updatedEntity);
  }

  async delete(id: number) {
    await this.repository.delete(id);
  }
}
