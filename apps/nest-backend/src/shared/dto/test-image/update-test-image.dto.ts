import { PartialType } from '@nestjs/mapped-types';
import { CreateTestImageDto } from './create-test-image.dto';

export class UpdateTestImageDto extends PartialType(CreateTestImageDto) {}
