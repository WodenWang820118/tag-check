import { ApiProperty } from '@nestjs/swagger';
import { CookieData, EventInspectionPreset, LocalStorageData } from '@utils';
import { IsArray, ValidateNested } from 'class-validator';

// Create a new DTO for localStorage
export class LocalStorageDto {
  @IsArray()
  data!: LocalStorageData[];
}

// Create a new DTO for cookie
export class CookieDto {
  @IsArray()
  data!: CookieData[];
}

export class ApplicationDto {
  @ValidateNested()
  localStorage!: LocalStorageDto;

  @ValidateNested()
  cookie!: CookieDto;
}

export class EventInspectionPresetDto implements EventInspectionPreset {
  @ValidateNested()
  @ApiProperty()
  application!: ApplicationDto;

  @ApiProperty()
  @IsArray()
  puppeteerArgs!: string[]; // An array of strings for Puppeteer arguments
}
