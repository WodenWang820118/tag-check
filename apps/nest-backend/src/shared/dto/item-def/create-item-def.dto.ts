import { LocalStorage } from '@utils';
import { IsJSON } from 'class-validator';

export class CreateItemDefDto {
  @IsJSON()
  fullItemDef!: LocalStorage;

  itemId!: string;

  templateName!: string;
}
