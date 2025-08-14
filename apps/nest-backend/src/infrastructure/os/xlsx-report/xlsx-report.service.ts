import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  StreamableFile
} from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { FullTestEventResponseDto } from '../../../shared';
import { XlsxHeaderService } from './xlsx-header.service';
import { XlsxTestInfoSectionService } from './xlsx-test-info-section.service';
import { XlsxTestDataSectionService } from './xlsx-test-data-section.service';
import { XlsxSummarySectionService } from './xlsx-summary-section.service';
import { XlsxRecordingSectionService } from './xlsx-recordinng-section.service';

@Injectable()
export class XlsxReportService {
  private readonly logger = new Logger(XlsxReportService.name);
  constructor(
    private readonly xlsxHeaderService: XlsxHeaderService,
    private readonly xlsxTestInfoSectionService: XlsxTestInfoSectionService,
    private readonly xlsxTestDataSectionService: XlsxTestDataSectionService,
    private readonly xlsxSummarySectionService: XlsxSummarySectionService,
    private readonly xlsxRecordingSectionService: XlsxRecordingSectionService
  ) {}
  async writeXlsxFile(reports: FullTestEventResponseDto[]) {
    try {
      const workbook = new ExcelJS.Workbook();

      // Group reports by project for better organization
      const projectGroups = this.groupReportsByProject(reports);

      for (const [, projectReports] of Object.entries(projectGroups)) {
        // Extract project info from the first report in the group
        const projectInfo = this.extractProjectInfo(projectReports[0]);

        for (const report of projectReports) {
          // Create sheet name using test name and event name
          const worksheetName = `${report.testName} - ${report.eventName || 'No Event'}`;
          const worksheet = workbook.addWorksheet(worksheetName);

          // Add project header information (dashboard-like)
          this.xlsxHeaderService.addProjectHeader(
            worksheet,
            projectInfo,
            report
          );

          // Add test information section
          this.xlsxTestInfoSectionService.addTestInfoSection(worksheet, report);

          // Add test image if available
          let imageRowOffset = 0;
          if (report.testImage.imageData) {
            // FIXME: Buffer incompatibility
            const imageBuffer = Buffer.from(
              report.testImage.imageData
            ) as unknown as ExcelJS.Buffer;
            const imageId = workbook.addImage({
              buffer: imageBuffer,
              extension: 'png'
            });

            // Position the image below the header sections
            worksheet.addImage(imageId, {
              tl: { col: 0, row: 12 },
              ext: { width: 300, height: 150 }
            });
            imageRowOffset = 10; // Add offset for image space
          }
          this.logger.log(`${JSON.stringify(report.spec, null, 2)}`);
          // Add test data section with proper column headers
          this.xlsxTestDataSectionService.addTestDataSection(
            worksheet,
            report,
            12 + imageRowOffset
          );

          // Add summary section at the bottom
          this.xlsxSummarySectionService.addSummarySection(
            worksheet,
            report,
            16 + imageRowOffset
          );

          // Add recording section if available
          this.xlsxRecordingSectionService.addRecordingSection(
            worksheet,
            report
          );
        }
      }

      // Generate filename based on project info from the first report
      const projectInfo = this.extractProjectInfo(reports[0]);
      const fileName = `${projectInfo.projectName}-${projectInfo.projectSlug}`;

      // FIXME: Buffer incompatibility
      const buffer = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;

      return new StreamableFile(buffer, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        disposition: `attachment; filename="${fileName}.xlsx"`
      });
    } catch (error) {
      this.handleError(error, 'writeXlsxFile');
      throw new HttpException(
        'An error occurred while processing the Excel file',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private groupReportsByProject(
    reports: FullTestEventResponseDto[]
  ): Record<string, FullTestEventResponseDto[]> {
    const groups: Record<string, FullTestEventResponseDto[]> = {};

    for (const report of reports) {
      const projectInfo = this.extractProjectInfo(report);
      const key = `${projectInfo.projectName}-${projectInfo.projectSlug}`;

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(report);
    }

    return groups;
  }

  private extractProjectInfo(report: FullTestEventResponseDto): {
    projectName: string;
    projectSlug: string;
    projectDescription: string;
    measurementId: string;
  } {
    return {
      projectName: report.project.projectName || 'Unknown Project',
      projectSlug: report.project.projectSlug || 'unknown-project',
      projectDescription:
        report.project.projectDescription || 'No description available',
      measurementId: report.project.measurementId || 'No measurement ID'
    };
  }

  private handleError(error: unknown, methodName: string) {
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
