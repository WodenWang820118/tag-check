import { PartialType } from '@nestjs/mapped-types';
import { CreateTestDataLayerDto } from './create-test-data-layer.dto';

export class UpdateTestDataLayerDto extends PartialType(
  CreateTestDataLayerDto
) {}
