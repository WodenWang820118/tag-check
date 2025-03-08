import { Injectable } from '@nestjs/common';
import { FullTestEventResponseDto } from '../../../shared';
import * as ExcelJS from 'exceljs';

@Injectable()
export class XlsxHeaderService {
  addProjectHeader(
    worksheet: ExcelJS.Worksheet,
    projectInfo: {
      projectName: string;
      projectSlug: string;
      projectDescription: string;
      measurementId: string;
    },
    report: FullTestEventResponseDto
  ): void {
    // Add project title
    const titleRow = worksheet.addRow([
      `Project: ${projectInfo.projectName} (${projectInfo.projectSlug})`
    ]);
    titleRow.font = { bold: true, size: 16 };
    worksheet.mergeCells(`A${titleRow.number}:G${titleRow.number}`);

    // Add project description
    const descRow = worksheet.addRow([
      'Description:',
      projectInfo.projectDescription
    ]);
    worksheet.mergeCells(`B${descRow.number}:G${descRow.number}`);

    // Add measurement ID
    const measurementRow = worksheet.addRow([
      'Measurement ID:',
      projectInfo.measurementId
    ]);
    worksheet.mergeCells(`B${measurementRow.number}:G${measurementRow.number}`);

    // Add empty row for spacing
    worksheet.addRow([]);
  }
}
