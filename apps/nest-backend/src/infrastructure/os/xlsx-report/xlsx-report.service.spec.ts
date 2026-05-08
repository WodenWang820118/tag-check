import { describe, it, expect, vi } from 'vitest';
import { HttpException, StreamableFile } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { XlsxReportService } from './xlsx-report.service';
import type { FullTestEventResponseDto } from '../../../shared';

describe('XlsxReportService', () => {
  function build() {
    const xlsxHeaderService = { addProjectHeader: vi.fn() };
    const xlsxTestInfoSectionService = { addTestInfoSection: vi.fn() };
    const xlsxTestDataSectionService = { addTestDataSection: vi.fn() };
    const xlsxSummarySectionService = { addSummarySection: vi.fn() };
    const xlsxRecordingSectionService = { addRecordingSection: vi.fn() };
    const groupingService = {
      groupReportsByProject: vi.fn((reports: FullTestEventResponseDto[]) => ({
        p: reports
      })),
      extractProjectInfo: vi.fn(() => ({
        projectName: 'demo',
        projectSlug: 'demo-slug'
      }))
    };
    const nameService = {
      sanitiseWorksheetName: vi.fn((n: string) => n.slice(0, 31))
    };
    const imageService = { embedImage: vi.fn() };

    const svc = new XlsxReportService(
      xlsxHeaderService as never,
      xlsxTestInfoSectionService as never,
      xlsxTestDataSectionService as never,
      xlsxSummarySectionService as never,
      xlsxRecordingSectionService as never,
      groupingService as never,
      nameService as never,
      imageService as never
    );
    return {
      svc,
      xlsxHeaderService,
      xlsxTestInfoSectionService,
      xlsxTestDataSectionService,
      xlsxSummarySectionService,
      xlsxRecordingSectionService,
      groupingService,
      nameService,
      imageService
    };
  }

  it('builds a workbook with one worksheet per report and returns a StreamableFile', async () => {
    const { svc, xlsxHeaderService, imageService, nameService } = build();
    const reports = [
      { testName: 't1', eventName: 'view' },
      { testName: 't2', eventName: undefined }
    ] as unknown as FullTestEventResponseDto[];

    const result = await svc.writeXlsxFile(reports);

    expect(result).toBeInstanceOf(StreamableFile);
    expect(xlsxHeaderService.addProjectHeader).toHaveBeenCalledTimes(2);
    expect(imageService.embedImage).toHaveBeenCalledTimes(2);
    expect(nameService.sanitiseWorksheetName).toHaveBeenCalledWith(
      't2 - No Event'
    );
  });

  it('wraps internal failures in a 500 HttpException', async () => {
    const { svc, xlsxHeaderService } = build();
    xlsxHeaderService.addProjectHeader.mockImplementation(() => {
      throw new Error('boom');
    });

    await expect(
      svc.writeXlsxFile([{ testName: 't' }] as never)
    ).rejects.toBeInstanceOf(HttpException);
  });

  it('passes through HttpException without re-wrapping', async () => {
    const { svc, xlsxHeaderService } = build();
    const original = new HttpException('nope', 418);
    xlsxHeaderService.addProjectHeader.mockImplementation(() => {
      throw original;
    });

    await expect(svc.writeXlsxFile([{ testName: 't' }] as never)).rejects.toBe(
      original
    );
  });

  it('uses ExcelJS workbooks (smoke check)', () => {
    // Just makes sure the import is alive and writeBuffer exists on a real workbook
    const wb = new ExcelJS.Workbook();
    expect(typeof wb.xlsx.writeBuffer).toBe('function');
  });
});
