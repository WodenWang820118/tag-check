import { Body, Controller, Logger, Param, Post } from '@nestjs/common';
import { GtmImportPreview, GtmImportSummary } from '@utils';
import { GtmParserService } from '../../features/gtm-parser/gtm-parser.service';

/** The saved container is read through `GET projects/:projectSlug/gtm-config`. */
@Controller('gtm-parser')
export class GtmParserController {
  private readonly logger = new Logger(GtmParserController.name);
  constructor(private readonly gtmParserService: GtmParserService) {}

  /**
   * Reports tags whose name already has a test but whose event name changed.
   * Takes the same body as upload and writes nothing.
   */
  @Post('/preview/:projectSlug')
  async previewGtmJson(
    @Param('projectSlug') projectSlug: string,
    @Body() payload: unknown
  ): Promise<GtmImportPreview> {
    return await this.gtmParserService.previewGtmJson(projectSlug, payload);
  }

  /**
   * Accepts the container export as a JSON body or as its text, or
   * `{ container, resolutions }` once the user has chosen update or keep both
   * for each tag whose event name changed.
   */
  @Post('/upload/:projectSlug')
  async uploadGtmJson(
    @Param('projectSlug') projectSlug: string,
    @Body() payload: unknown
  ): Promise<GtmImportSummary> {
    this.logger.log(`Uploading GTM JSON for project: ${projectSlug}`);
    return await this.gtmParserService.uploadGtmJson(projectSlug, payload);
  }
}
