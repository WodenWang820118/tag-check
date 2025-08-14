import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InspectEventQueryDto {
  @ApiProperty({ description: 'Specifies if the test runs in headless mode.' })
  headless?: string;

  @ApiPropertyOptional({
    description: 'An optional identifier to measure or differentiate events.'
  })
  measurementId?: string;

  @ApiPropertyOptional({
    description:
      'Optional username for authentication purposes. If provided, password must also be provided.'
  })
  username?: string;

  @ApiPropertyOptional({
    description: 'Optional password for authentication purposes.'
  })
  password?: string;

  @ApiPropertyOptional({
    description: 'Whether to capture the request payload.'
  })
  captureRequest?: string;

  @ApiPropertyOptional({ description: 'Concurrency for project inspections.' })
  concurrency?: number;

  @ApiPropertyOptional({
    description: 'The URL to inspect'
  })
  url!: string;
}
