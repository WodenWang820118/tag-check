import { ApiProperty } from '@nestjs/swagger';
import { ProjectInfo } from '@utils';

export class ProjectInfoDto implements ProjectInfo {
  @ApiProperty()
  projectSlug: string;

  @ApiProperty()
  projectName: string;

  @ApiProperty()
  projectDescription: string;

  @ApiProperty()
  measurementId: string;

  @ApiProperty()
  googleSpreadsheetLink: string;

  @ApiProperty()
  version: string;

  @ApiProperty()
  rootProject: string;
}
