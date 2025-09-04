import { PartialType } from '@nestjs/mapped-types';
import { CreateItemDefDto } from './create-item-def.dto';

export class UpdateItemDefDto extends PartialType(CreateItemDefDto) {}
