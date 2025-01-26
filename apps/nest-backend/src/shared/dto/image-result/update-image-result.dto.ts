import { PartialType } from '@nestjs/mapped-types';
import { CreateImageResultDto } from './create-image-result.dto';

export class UpdateImageResultDto extends PartialType(CreateImageResultDto) {}
