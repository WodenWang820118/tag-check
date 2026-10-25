import { of } from 'rxjs';
import { ReportDetailPanelsFacadeService } from './report-detail-panels-facade.service';

describe('ReportDetailPanelsFacadeService', () => {
  let specService: { updateSpec: ReturnType<typeof vi.fn> };
  let recordingService: { updateRecording: ReturnType<typeof vi.fn> };
  let itemDefService: {
    getItemDef: ReturnType<typeof vi.fn>;
    updateItemDef: ReturnType<typeof vi.fn>;
  };
  let service: ReportDetailPanelsFacadeService;

  beforeEach(() => {
    specService = { updateSpec: vi.fn() };
    recordingService = { updateRecording: vi.fn() };
    itemDefService = { getItemDef: vi.fn(), updateItemDef: vi.fn() };
    service = new ReportDetailPanelsFacadeService(
      specService as never,
      recordingService as never,
      itemDefService as never
    );
  });

  it('readFile delegates to File.text', async () => {
    const file = { text: () => Promise.resolve('contents') } as File;
    expect(await service.readFile(file)).toBe('contents');
  });

  it('updateSpec forwards arguments to SpecService.updateSpec', () => {
    const result = of({});
    specService.updateSpec.mockReturnValue(result);
    expect(service.updateSpec('slug', 'evt', { spec: {} } as never)).toBe(
      result
    );
    expect(specService.updateSpec).toHaveBeenCalledWith('slug', 'evt', {
      spec: {}
    });
  });

  it('updateRecording forwards arguments to RecordingService.updateRecording', () => {
    const result = of({} as never);
    recordingService.updateRecording.mockReturnValue(result);
    expect(service.updateRecording('slug', 'evt', { name: 'r' } as never)).toBe(
      result
    );
    expect(recordingService.updateRecording).toHaveBeenCalledWith(
      'slug',
      'evt',
      { name: 'r' }
    );
  });

  it('getItemDef forwards the project and eventId to ItemDefService.getItemDef', () => {
    const result = of(null);
    itemDefService.getItemDef.mockReturnValue(result);
    expect(service.getItemDef('slug', 'evt')).toBe(result);
    expect(itemDefService.getItemDef).toHaveBeenCalledWith('slug', 'evt');
  });

  it('updateItemDef forwards arguments to ItemDefService.updateItemDef', () => {
    const result = of({} as never);
    itemDefService.updateItemDef.mockReturnValue(result);
    expect(service.updateItemDef('slug', 'evt', { templateName: 'x' })).toBe(
      result
    );
    expect(itemDefService.updateItemDef).toHaveBeenCalledWith('slug', 'evt', {
      templateName: 'x'
    });
  });
});
