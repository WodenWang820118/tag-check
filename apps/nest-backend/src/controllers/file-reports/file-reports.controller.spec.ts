import { describe, expect, it, vi } from 'vitest';
import { RUN_SUMMARY_SAMPLE } from '@utils';
import { FileReportsController } from './file-reports.controller';

describe('FileReportsController', () => {
  function build() {
    const projectFileReportService = {
      deleteReportFile: vi.fn().mockResolvedValue('deleted'),
      downloadReportFiles: vi.fn().mockResolvedValue('xlsx-buffer'),
      listRuns: vi.fn().mockResolvedValue([RUN_SUMMARY_SAMPLE])
    };
    const controller = new FileReportsController(
      projectFileReportService as never
    );
    return { controller, projectFileReportService };
  }

  it('delegates deleteReportFile to ProjectFileReportService', async () => {
    const { controller, projectFileReportService } = build();
    const result = await controller.deleteReportFile('proj-1', '/tmp/a.json');
    expect(projectFileReportService.deleteReportFile).toHaveBeenCalledWith(
      'proj-1',
      '/tmp/a.json'
    );
    expect(result).toBe('deleted');
  });

  it('lists the project runs through ProjectFileReportService', async () => {
    const { controller, projectFileReportService } = build();
    const result = await controller.listRuns('proj-1');
    expect(projectFileReportService.listRuns).toHaveBeenCalledWith('proj-1');
    expect(result).toEqual([RUN_SUMMARY_SAMPLE]);
  });

  it('delegates downloadReportFiles to ProjectFileReportService', async () => {
    const { controller, projectFileReportService } = build();
    const result = await controller.downloadReportFiles('proj-1', [
      'evt-1',
      'evt-2'
    ]);
    expect(projectFileReportService.downloadReportFiles).toHaveBeenCalledWith(
      'proj-1',
      ['evt-1', 'evt-2']
    );
    expect(result).toBe('xlsx-buffer');
  });
});
