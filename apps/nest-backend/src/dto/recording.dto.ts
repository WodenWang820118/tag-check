import { ApiProperty } from '@nestjs/swagger';
import { Recording } from '@utils';

export class RecordingDto implements Recording {
  @ApiProperty()
  title: string;

  @ApiProperty()
  steps: any[];
}
