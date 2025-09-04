import {
  IReportDetails,
  ItemDef,
  Recording,
  Spec,
  StrictDataLayerEvent
} from '@utils';
import { IsNotEmpty } from 'class-validator';

export class CreateFullTestEventDto {
  @IsNotEmpty()
  reportDetails!: IReportDetails;

  @IsNotEmpty()
  recording!: Recording;

  @IsNotEmpty()
  spec!: Spec;

  @IsNotEmpty()
  fullItemDef?: ItemDef;

  @IsNotEmpty()
  dataLayerSpec!: StrictDataLayerEvent;
}
