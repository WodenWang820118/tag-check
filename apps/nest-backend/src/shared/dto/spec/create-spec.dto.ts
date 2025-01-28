import { Spec } from '@utils';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSpecDto implements Spec {
  @IsNotEmpty()
  @IsString()
  event!: string;

  @IsNotEmpty()
  specData!: Spec;
}
