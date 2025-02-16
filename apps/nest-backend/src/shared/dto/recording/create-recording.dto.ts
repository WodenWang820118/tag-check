import { Recording } from '@utils';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRecordingDto implements Recording {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  steps!: Record<string, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
}
