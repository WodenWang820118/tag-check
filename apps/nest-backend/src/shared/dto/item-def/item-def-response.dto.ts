import { Exclude } from 'class-transformer';
import { LocalStorage } from '@utils';
import { IsJSON } from 'class-validator';

@Exclude()
export class ItemDefResponseDto {
  @IsJSON()
  fullItemDef!: LocalStorage;

  itemId!: string;

  templateName!: string;
}
