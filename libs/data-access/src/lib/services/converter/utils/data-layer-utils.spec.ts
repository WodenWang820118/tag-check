import { TestBed } from '@angular/core/testing';
import { DataLayerUtils } from './data-layer-utils.service';

describe('DataLayerManager', () => {
  let service: DataLayerUtils;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DataLayerUtils],
    });
    service = TestBed.inject(DataLayerUtils);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add unique paths to dataLayers', () => {
    const paths = ['path1', 'path2', 'path3'];
    service.addDataLayer(paths);
    expect(service.dataLayers).toEqual(paths);
  });

  it('should not add duplicate paths', () => {
    service.dataLayers = ['existingPath'];
    const paths = ['existingPath', 'newPath'];
    service.addDataLayer(paths);
    expect(service.dataLayers).toEqual(['existingPath', 'newPath']);
  });

  it('should return only unique paths', () => {
    const paths = ['path1', 'path2', 'path3'];
    const existingDataLayers = ['path2', 'path4'];
    const result = service.filterDuplicates(paths, existingDataLayers);
    expect(result).toEqual(['path1', 'path3']);
  });

  it('should return true if dLReference exists in dataLayers', () => {
    const dataLayers = ['path1', 'path2.subpath', 'path3'];
    const result = service.hasExistedDataLayer('path2', dataLayers);
    expect(result).toBe(true);
  });

  it('should return false if dLReference does not exist in dataLayers', () => {
    const dataLayers = ['path1', 'path2', 'path3'];
    const result = service.hasExistedDataLayer('path4', dataLayers);
    expect(result).toBe(false);
  });

  describe('getDataLayers', () => {
    beforeEach(() => {
      service.dataLayers = [
        'path1',
        'ecommerce.items.0.something',
        'path2',
        'ecommerce.items.0.other',
      ];
    });

    it('should return all dataLayers when includeItemScopedVariables is true', () => {
      const result = service.getDataLayers(true);
      expect(result).toEqual(service.dataLayers);
    });

    it('should filter out ecommerce.items.0 paths when includeItemScopedVariables is false', () => {
      const result = service.getDataLayers(false);
      expect(result).toEqual(['path1', 'path2']);
    });
  });
});
