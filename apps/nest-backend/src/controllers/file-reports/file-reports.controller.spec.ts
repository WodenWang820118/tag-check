import { describe, expect, it, vi } from 'vitest';
import { RUN_SUMMARY_SAMPLE } from '@utils';
import { FileReportsController } from './file-reports.controller';

describe('FileReportsController', () => {
  function build() {
    const projectFileReportService = {
      deleteRuns: vi.fn().mockResolvedValue({ deletedRunIds: [7, 9] }),
      downloadReportFiles: vi.fn().mockResolvedValue('xlsx-buffer'),
      listRuns: vi.fn().mockResolvedValue([RUN_SUMMARY_SAMPLE])
    };
    const controller = new FileReportsController(
      projectFileReportService as never
    );
    return { controller, projectFileReportService };
  }

  it('deletes the runs listed in runIds', async () => {
    const { controller, projectFileReportService } = build();
    const result = await controller.deleteRuns('proj-1', '7, 9');
    expect(projectFileReportService.deleteRuns).toHaveBeenCalledWith(
      'proj-1',
      [7, 9]
    );
    expect(result).toEqual({ deletedRunIds: [7, 9] });
  });

  it.each([undefined, '', '7,x', '0', '-1', '1.5'])(
    'rejects runIds %j',
    async (runIds) => {
      const { controller, projectFileReportService } = build();
      await expect(
        controller.deleteRuns('proj-1', runIds)
      ).rejects.toMatchObject({ status: 400 });
      expect(projectFileReportService.deleteRuns).not.toHaveBeenCalled();
    }
  );

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
