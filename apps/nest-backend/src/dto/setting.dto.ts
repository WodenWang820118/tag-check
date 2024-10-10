import { ApiProperty } from '@nestjs/swagger';
import { Setting, Application, Authentication, Gtm } from '@utils';
import { IsArray } from 'class-validator';

export class SettingDto implements Setting {
  @ApiProperty()
  rootProject!: string;

  @ApiProperty()
  projectName!: string;

  @ApiProperty()
  projectDescription!: string;

  @ApiProperty()
  measurementId!: string;

  @ApiProperty()
  projectSlug!: string;

  @ApiProperty()
  googleSpreadsheetLink!: string;

  @ApiProperty()
  gtm!: Gtm;

  @ApiProperty()
  version!: string;

  @ApiProperty()
  @IsArray()
  preventNavigationEvents!: string[];

  @ApiProperty()
  application!: Application;

  @ApiProperty()
  @IsArray()
  browser!: string[];

  @ApiProperty()
  headless!: boolean;

  @ApiProperty()
  authentication!: Authentication;
}
