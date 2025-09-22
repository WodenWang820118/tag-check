import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { GtmParserService } from '../../features/gtm-parser/gtm-parser.service';

@Controller('gtm-parser')
export class GtmParserController {
  private readonly logger = new Logger(GtmParserController.name);
  constructor(private readonly gtmParserService: GtmParserService) {}

  @Get('/:projectSlug')
  async getGtmJson(@Param('projectSlug') projectSlug: string) {
    this.logger.log(`Retrieving GTM JSON for project: ${projectSlug}`);
    return await Promise.resolve({});
  }

  @Post('/upload/:projectSlug')
  async uploadGtmJson(
    @Param('projectSlug') projectSlug: string,
    @Body() json: string
  ) {
    this.logger.log(`Uploading GTM JSON for project: ${projectSlug}`);
    try {
      let body: any = json;
      if (typeof json === 'string') {
        try {
          body = JSON.parse(json);
          this.logger.debug(
            'Request body is a string and valid JSON; using parsed object'
          );
        } catch (e: unknown) {
          this.logger.debug(
            'Request body is a string but not valid JSON; writing raw string; error: ' +
              (e instanceof Error ? e.message : JSON.stringify(e, null, 2))
          );
        }
      }

      return await this.gtmParserService.uploadGtmJson(projectSlug, body);
    } catch (error) {
      this.logger.error(
        `Failed to upload GTM JSON for project: ${projectSlug}`,
        error
      );
      throw error;
    }
  }
}
