import { TestBed } from '@angular/core/testing';
import { EventSettingsVariableService } from './event-settings-variable.service';
import { ParameterUtils } from '../utils/parameter-utils.service';
import {
  EventSettingsVariable,
  EventSettingsVariableConfig,
  VariableTypeEnum
} from '@utils';

describe('EventSettingsVariableService', () => {
  let service: EventSettingsVariableService;
  let parameterUtils: ParameterUtils;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EventSettingsVariableService,
        {
          provide: ParameterUtils,
          useValue: {
            createTemplateParameter: (key: string, value: string) => ({
              type: 'TEMPLATE',
              key,
              value
            })
          }
        }
      ]
    });

    service = TestBed.inject(EventSettingsVariableService);
    parameterUtils = TestBed.inject(ParameterUtils);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createEventSettingsVariable', () => {
    it('should create event settings variable config correctly', () => {
      const accountId = 'test-account';
      const containerId = 'test-container';
      const esvContent: EventSettingsVariable[] = [
        {
          name: 'testESV',
          parameters: [{ key1: 'value1' }, { key2: 'value2' }]
        }
      ];

      const result = service.createEventSettingsVariable(
        accountId,
        containerId,
        esvContent
      );

      const expected: EventSettingsVariableConfig[] = [
        {
          accountId: 'test-account',
          containerId: 'test-container',
          name: 'ESV - testESV',
          type: VariableTypeEnum.EVENT_SETTINGS,
          parameter: [
            {
              type: 'LIST',
              key: 'eventSettingsTable',
              list: [
                {
                  type: 'MAP',
                  map: [
                    { type: 'TEMPLATE', key: 'parameter', value: 'key1' },
                    { type: 'TEMPLATE', key: 'parameterValue', value: 'value1' }
                  ]
                },
                {
                  type: 'MAP',
                  map: [
                    { type: 'TEMPLATE', key: 'parameter', value: 'key2' },
                    { type: 'TEMPLATE', key: 'parameterValue', value: 'value2' }
                  ]
                }
              ]
            }
          ]
        }
      ];

      expect(result).toEqual(expected);
    });

    it('should handle multiple event settings variables', () => {
      const accountId = 'test-account';
      const containerId = 'test-container';
      const esvContent: EventSettingsVariable[] = [
        {
          name: 'esv1',
          parameters: [{ param1: 'value1' }]
        },
        {
          name: 'esv2',
          parameters: [{ param2: 'value2' }]
        }
      ];

      const result = service.createEventSettingsVariable(
        accountId,
        containerId,
        esvContent
      );

      expect(result.length).toBe(2);
      expect(result[0].name).toBe('ESV - esv1');
      expect(result[1].name).toBe('ESV - esv2');
    });
  });
});
