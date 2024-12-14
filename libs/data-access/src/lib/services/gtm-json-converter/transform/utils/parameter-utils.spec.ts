import { TestBed } from '@angular/core/testing';
import { ParameterUtils } from './parameter-utils.service';
import { Parameter, ParameterMap, Trigger, TriggerConfig } from '@utils';

describe('ParameterUtils', () => {
  let service: ParameterUtils;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ParameterUtils]
    });
    service = TestBed.inject(ParameterUtils);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a list parameter correctly', () => {
    const key = 'testKey';
    const parameters: Parameter[] = [
      {
        type: 'v',
        key: 'value',
        value: 'ecommerce.value'
      },
      {
        type: 'v',
        key: 'currency',
        value: 'ecommerce.currency'
      },
      {
        type: 'v',
        key: 'items',
        value: 'ecommerce.items'
      }
    ];

    const result = service.createListParameter(key, parameters);

    expect(result.type).toBe('LIST');
    expect(result.key).toBe(key);
    expect(result.list.length).toBe(3);
    expect(result.list[0].map[1].value).toBe('DLV - ecommerce.value');
    expect(result.list[1].map[1].value).toBe('DLV - ecommerce.currency');
    expect(result.list[2].map[1].value).toBe('DLV - ecommerce.items');
  });

  it('should create a built-in list parameter correctly', () => {
    const key = 'testKey';
    const mapParameters: ParameterMap[] = [
      { type: 'MAP', map: [{ type: '', key: 'param1', value: 'value1' }] },
      { type: 'MAP', map: [{ type: '', key: 'param2', value: 'value2' }] }
    ];

    const result = service.createBuiltInListParameter(key, mapParameters);

    expect(result.type).toBe('LIST');
    expect(result.key).toBe(key);
    expect(result.list).toEqual(mapParameters);
  });

  it('should create a map parameter correctly', () => {
    const name = 'testName';
    const value = 'testValue';

    const result = service.createMapParameter(name, value);

    expect(result.type).toBe('MAP');
    expect(result.map[0].key).toBe('parameter');
    expect(result.map[0].value).toBe(name);
    expect(result.map[1].key).toBe('parameterValue');
    expect(result.map[1].value).toBe(value);
  });

  it('should create an integer parameter correctly', () => {
    const key = 'testKey';
    const value = '42';

    const result = service.createIntegerParameter(key, value);

    expect(result.type).toBe('INTEGER');
    expect(result.key).toBe(key);
    expect(result.value).toBe(value);
  });

  it('should create a boolean parameter correctly', () => {
    const key = 'testKey';
    const value = 'true';

    const result = service.createBooleanParameter(key, value);

    expect(result.type).toBe('BOOLEAN');
    expect(result.key).toBe(key);
    expect(result.value).toBe(value);
  });

  it('should create a tag reference parameter correctly', () => {
    const key = 'testKey';
    const value = 'testValue';

    const result = service.createTagReferenceParameter(key, value);

    expect(result.type).toBe('TAG_REFERENCE');
    expect(result.key).toBe(key);
    expect(result.value).toBe(value);
  });

  it('should create a template parameter correctly', () => {
    const key = 'testKey';
    const value = 'testValue';

    const result = service.createTemplateParameter(key, value);

    expect(result.type).toBe('TEMPLATE');
    expect(result.key).toBe(key);
    expect(result.value).toBe(value);
  });

  it('should find the correct trigger ID', () => {
    const eventName = 'select_promotion';
    const triggers: Trigger[] = [
      {
        name: 'select_promotion',
        triggerId: '1'
      }
    ];

    const result = service.findTriggerIdByEventName(eventName, triggers);

    expect(result).toEqual(['1']);
  });

  it('should return an empty string if no matching trigger is found', () => {
    const eventName = 'nonExistentEvent';
    const triggers: Trigger[] = [
      {
        name: 'select_promotion',
        triggerId: '1'
      }
    ];

    const result = service.findTriggerIdByEventName(eventName, triggers);

    expect(result).toEqual([]);
  });
});
