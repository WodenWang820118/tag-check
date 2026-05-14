import type { Recording, Step } from '@utils';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRecordingDto implements Recording {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  steps!: Step[];
}
