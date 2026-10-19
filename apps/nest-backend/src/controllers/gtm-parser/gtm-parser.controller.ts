import { Body, Controller, Logger, Param, Post } from '@nestjs/common';
import { GtmImportSummary } from '@utils';
import { GtmParserService } from '../../features/gtm-parser/gtm-parser.service';

/** The saved container is read through `GET projects/:projectSlug/gtm-config`. */
@Controller('gtm-parser')
export class GtmParserController {
  private readonly logger = new Logger(GtmParserController.name);
  constructor(private readonly gtmParserService: GtmParserService) {}

  /** Accepts the container export as a JSON body or as its text. */
  @Post('/upload/:projectSlug')
  async uploadGtmJson(
    @Param('projectSlug') projectSlug: string,
    @Body() payload: unknown
  ): Promise<GtmImportSummary> {
    this.logger.log(`Uploading GTM JSON for project: ${projectSlug}`);
    return await this.gtmParserService.uploadGtmJson(projectSlug, payload);
  }
}
