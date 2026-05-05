import { TestBed } from '@angular/core/testing';
import { VariableManager } from './variable-manager.service';
import { DataLayerVariable } from '../variables/data-layer-variable.service';
import { ScrollVariable } from '../variables/scroll-variable.service';
import { VideoVariable } from '../variables/video-variable.service';
import { ConstantVariable } from '../variables/constant-variable.service';
import { EventSettingsVariableService } from '../variables/event-settings-variable.service';
import { EventUtils } from '../../utils/event-utils.service';
import { ParameterUtils } from '../utils/parameter-utils.service';
import type { DataLayer, EventSettingsVariable, VariableConfig } from '@utils';

describe('VariableManager', () => {
  let service: VariableManager;
  let eventUtils: EventUtils;

  const mockAccountId = 'acc-1';
  const mockContainerId = 'con-1';
  const mockMeasurementId = 'G-ABCDEFGH';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VariableManager,
        DataLayerVariable,
        ScrollVariable,
        VideoVariable,
        ConstantVariable,
        EventSettingsVariableService,
        EventUtils,
        ParameterUtils
      ]
    });
    service = TestBed.inject(VariableManager);
    eventUtils = TestBed.inject(EventUtils);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getVariables', () => {
    it('should create data layer variables from provided data layers', () => {
      const dataLayers: DataLayer[] = [
        { event: 'page_view', paths: ['page_location', 'page_title'] }
      ];

      const result = service.getVariables({
        accountId: mockAccountId,
        containerId: mockContainerId,
        measurementId: mockMeasurementId,
        dataLayers,
        esvContent: []
      });

      // Should include DLV variables for each path + the measurement ID constant
      const dlvVars = result.filter((v) => v.name.startsWith('DLV - '));
      expect(dlvVars).toHaveLength(2);
      expect(dlvVars.map((v) => v.name)).toEqual(
        expect.arrayContaining(['DLV - page_location', 'DLV - page_title'])
      );
    });

    it('should include a measurement ID constant variable', () => {
      const result = service.getVariables({
        accountId: mockAccountId,
        containerId: mockContainerId,
        measurementId: mockMeasurementId,
        dataLayers: [],
        esvContent: []
      });

      const constVar = result.find((v) => v.name === 'CONST - Measurement ID');
      expect(constVar).toBeTruthy();
      expect(constVar?.type).toBe('c');
    });

    it('should deduplicate data layer variables by name', () => {
      const dataLayers: DataLayer[] = [
        { event: 'page_view', paths: ['page_location'] },
        { event: 'purchase', paths: ['page_location', 'value'] }
      ];

      const result = service.getVariables({
        accountId: mockAccountId,
        containerId: mockContainerId,
        measurementId: mockMeasurementId,
        dataLayers,
        esvContent: []
      });

      const dlvVars = result.filter((v) => v.name.startsWith('DLV - '));
      // 'page_location' appears in both events but should only be created once
      expect(dlvVars).toHaveLength(2);
      const names = dlvVars.map((v) => v.name);
      expect(names).toEqual(
        expect.arrayContaining(['DLV - page_location', 'DLV - value'])
      );
    });

    it('should assign sequential variableIds starting from "1"', () => {
      const result = service.getVariables({
        accountId: mockAccountId,
        containerId: mockContainerId,
        measurementId: mockMeasurementId,
        dataLayers: [],
        esvContent: []
      });

      // At minimum we have the measurement ID constant
      expect(result.length).toBeGreaterThan(0);
      for (let i = 0; i < result.length; i++) {
        expect(result[i].variableId).toBe(String(i + 1));
      }
    });

    it('should create event settings variables when esvContent is provided', () => {
      const esvContent: EventSettingsVariable[] = [
        {
          name: 'GA4 Event Settings',
          parameters: [{ param1: 'value1' }]
        }
      ];

      const result = service.getVariables({
        accountId: mockAccountId,
        containerId: mockContainerId,
        measurementId: mockMeasurementId,
        dataLayers: [],
        esvContent
      });

      const esvVars = result.filter((v) => v.type === 'gtes');
      expect(esvVars.length).toBeGreaterThan(0);
    });

    it('should handle empty data layers and esv content', () => {
      const result = service.getVariables({
        accountId: mockAccountId,
        containerId: mockContainerId,
        measurementId: mockMeasurementId,
        dataLayers: [],
        esvContent: []
      });

      // Should at least have the constant measurement ID variable
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((v) => typeof v.variableId === 'string')).toBe(true);
    });
  });

  describe('getBuiltInVariables', () => {
    it('should return empty array when no video or scroll events exist', () => {
      const dataLayers: DataLayer[] = [{ event: 'page_view', paths: [] }];

      const result = service.getBuiltInVariables({
        accountId: mockAccountId,
        containerId: mockContainerId,
        dataLayers
      });

      expect(result).toEqual([]);
    });

    it('should include video built-in variables when video events are present', () => {
      const dataLayers: DataLayer[] = [{ event: 'video_start', paths: [] }];

      const result = service.getBuiltInVariables({
        accountId: mockAccountId,
        containerId: mockContainerId,
        dataLayers
      });

      const videoVarNames = result.map((v) => v.name);
      expect(videoVarNames).toEqual(
        expect.arrayContaining([
          'Video Provider',
          'Video URL',
          'Video Title',
          'Video Duration',
          'Video Percent',
          'Video Visible',
          'Video Status',
          'Video Current Time'
        ])
      );
    });

    it('should include scroll built-in variable when scroll event is present', () => {
      const dataLayers: DataLayer[] = [{ event: 'scroll', paths: [] }];

      const result = service.getBuiltInVariables({
        accountId: mockAccountId,
        containerId: mockContainerId,
        dataLayers
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Scroll Depth Threshold');
    });

    it('should include both video and scroll variables when both event types exist', () => {
      const dataLayers: DataLayer[] = [
        { event: 'video_start', paths: [] },
        { event: 'scroll', paths: [] }
      ];

      const result = service.getBuiltInVariables({
        accountId: mockAccountId,
        containerId: mockContainerId,
        dataLayers
      });

      const names = result.map((v) => v.name);
      expect(names).toEqual(
        expect.arrayContaining(['Scroll Depth Threshold', 'Video Provider'])
      );
      // Video has 8 built-ins, scroll has 1
      expect(result.length).toBe(9);
    });
  });
});
