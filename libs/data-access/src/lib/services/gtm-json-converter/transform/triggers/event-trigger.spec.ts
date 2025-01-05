import { TestBed } from '@angular/core/testing';
import { EventTrigger } from './event-trigger.service';
import { ParameterUtils } from '../utils/parameter-utils.service';
import { CustomEventTriggerConfig, TriggerTypeEnum } from '@utils';

describe('EventTrigger', () => {
  let service: EventTrigger;
  let parameterUtils: ParameterUtils;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EventTrigger, ParameterUtils]
    });

    service = TestBed.inject(EventTrigger);
    parameterUtils = TestBed.inject(ParameterUtils);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a trigger config correctly', () => {
    const accountId = 'test-account';
    const containerId = 'test-container';
    const trigger = 'test-trigger';

    const result = service.createTrigger(accountId, containerId, trigger);
    const expected: CustomEventTriggerConfig = {
      accountId,
      containerId,
      type: TriggerTypeEnum.CUSTOM_EVENT,
      name: `event equals ${trigger}`,
      customEventFilter: [
        {
          type: 'EQUALS',
          parameter: [
            { type: 'TEMPLATE', key: 'arg0', value: '{{_event}}' },
            { type: 'TEMPLATE', key: 'arg1', value: trigger }
          ]
        }
      ]
    };
    expect(result).toEqual(expected);
  });
});
