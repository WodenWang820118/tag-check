import { Exclude, Expose } from 'class-transformer';
import { LocalStorage } from '@utils';
import { IsJSON } from 'class-validator';

@Exclude()
export class ItemDefResponseDto {
  @Expose()
  @IsJSON()
  fullItemDef!: LocalStorage;

  @Expose()
  itemId!: string;

  @Expose()
  templateName!: string;
}
