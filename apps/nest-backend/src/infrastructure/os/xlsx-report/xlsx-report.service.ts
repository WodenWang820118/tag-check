import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  StreamableFile
} from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { FullTestEventResponseDto } from '../../../shared';
import { XlsxReportGroupingService } from './services/xlsx-report-grouping.service';
import { XlsxNameService } from './services/xlsx-name.service';
import { XlsxImageService } from './services/xlsx-image.service';
import { XlsxHeaderService } from './xlsx-header.service';
import { XlsxTestInfoSectionService } from './xlsx-test-info-section.service';
import { XlsxTestDataSectionService } from './xlsx-test-data-section.service';
import { XlsxSummarySectionService } from './xlsx-summary-section.service';
import { XlsxRecordingSectionService } from './xlsx-recordinng-section.service';

/**
 * Builds the spreadsheet export: one sheet per test with the project header,
 * the test's info, every run's data, a summary, the recording steps and the
 * latest screenshot.
 */
@Injectable()
export class XlsxReportService {
  private readonly logger = new Logger(XlsxReportService.name);
  constructor(
    private readonly xlsxHeaderService: XlsxHeaderService,
    private readonly xlsxTestInfoSectionService: XlsxTestInfoSectionService,
    private readonly xlsxTestDataSectionService: XlsxTestDataSectionService,
    private readonly xlsxSummarySectionService: XlsxSummarySectionService,
    private readonly xlsxRecordingSectionService: XlsxRecordingSectionService,
    private readonly groupingService: XlsxReportGroupingService,
    private readonly nameService: XlsxNameService,
    private readonly imageService: XlsxImageService
  ) {}
  /**
   * @param reports - At least one test; the file is named after the first
   * one's project.
   * @throws HttpException 500 when building the workbook fails.
   */
  async writeXlsxFile(reports: FullTestEventResponseDto[]) {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheetNames = new Set<string>();

      // Group reports by project for better organization
      const projectGroups = this.groupingService.groupReportsByProject(reports);

      for (const [, projectReports] of Object.entries(projectGroups)) {
        // Extract project info from the first report in the group
        const projectInfo = this.groupingService.extractProjectInfo(
          projectReports[0]
        );

        for (const report of projectReports) {
          // Sheet names are cut to 31 characters, so two tests can share one.
          const worksheetName = this.nameService.uniqueWorksheetName(
            `${report.testName} - ${report.eventName || 'No Event'}`,
            sheetNames
          );
          const worksheet = workbook.addWorksheet(worksheetName);

          // Build all textual/data sections first. We'll place the image afterwards so we can anchor at bottom-right.
          this.xlsxHeaderService.addProjectHeader(worksheet, projectInfo);
          this.xlsxTestInfoSectionService.addTestInfoSection(worksheet, report);
          this.xlsxTestDataSectionService.addTestDataSection(worksheet, report);
          this.xlsxSummarySectionService.addSummarySection(worksheet, report);
          this.xlsxRecordingSectionService.addRecordingSection(
            worksheet,
            report
          );

          // Attempt to add image to the right of the summary & recording sections (dynamically sized)
          this.imageService.embedImage(workbook, worksheet, report);
        }
      }

      // Generate filename based on project info from the first report
      const projectInfo = this.groupingService.extractProjectInfo(reports[0]);
      const fileName = `${projectInfo.projectName}-${projectInfo.projectSlug}`;

      const buffer = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;

      return new StreamableFile(buffer, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        disposition: `attachment; filename="${fileName}.xlsx"`
      });
    } catch (error) {
      this.handleError(error, 'writeXlsxFile');
    }
  }

  /** Logs the error and rethrows it as an HttpException. */
  private handleError(error: unknown, methodName: string): never {
    this.logger.error(
      `Error in ${XlsxReportService.name}.${methodName}: ${
        error instanceof Error ? error.message : JSON.stringify(error, null, 2)
      }`,
      error instanceof Error ? error.stack : undefined
    );
    if (error instanceof HttpException) {
      throw error;
    }
    throw new HttpException(
      'An error occurred while processing the Excel file',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
