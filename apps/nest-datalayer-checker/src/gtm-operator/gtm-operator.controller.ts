import { GtmOperatorService } from './gtm-operator.service';
import { Controller, Get, Query } from '@nestjs/common';

@Controller('gtm-operator')
export class GtmOperatorController {
  constructor(private gtmOperatorService: GtmOperatorService) {}

  @Get('gcs')
  async observeGcsViaGtm(@Query('gtmUrl') gtmUrl: string) {
    await this.gtmOperatorService.observeGcsViaGtm(gtmUrl);
  }

  @Get('anomalies')
  async observeAndKeepGcsAnomaliesViaGtm(
    @Query('gtmUrl') gtmUrl: string,
    @Query('expectValue') expectValue: string,
    @Query('loops') loops: string = '1',
    @Query('chunkSize') chunkSize: string = '1',
    @Query('args') args: string = '--incognito',
    @Query('headless') headless = 'false',
  ) {
    return this.gtmOperatorService.observeAndKeepGcsAnomaliesViaGtm(
      gtmUrl,
      expectValue,
      Number(loops),
      Number(chunkSize),
      args,
      headless,
    );
  }
}
