import { IsJSON } from 'class-validator';

export class CreateItemDefDto {
  @IsJSON()
  fullItemDef!: Record<string, unknown>;

  itemId!: string;

  templateName!: string;
}
