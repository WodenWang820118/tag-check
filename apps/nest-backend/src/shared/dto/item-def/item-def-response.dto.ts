import { Exclude, Expose } from 'class-transformer';
import { IsJSON } from 'class-validator';

@Exclude()
export class ItemDefResponseDto {
  @Expose()
  @IsJSON()
  fullItemDef!: Record<string, unknown>;

  @Expose()
  itemId!: string;

  @Expose()
  templateName!: string;
}
