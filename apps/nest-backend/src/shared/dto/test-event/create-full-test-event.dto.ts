import { IReportDetails, Recording, Spec } from '@utils';
import { IsNotEmpty } from 'class-validator';

export class CreateFullTestEventDto {
  @IsNotEmpty()
  reportDetails!: IReportDetails;

  @IsNotEmpty()
  recording!: Recording;

  @IsNotEmpty()
  spec!: Spec;
}
