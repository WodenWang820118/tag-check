// mock the result of isIncludeVideo and isIncludeScroll
jest.mock('../utilities/utilities', () => ({
  isIncludeVideo: jest.fn().mockReturnValue(true),
  isIncludeScroll: jest.fn().mockReturnValue(true),
}));

import {
  createMeasurementIdCJS,
  createVariable,
  getBuiltInVariables,
  getVariables,
} from '../managers/variable-manager';

describe('Helper Functions', () => {
  // Mock data for tests

  const mockData = {
    accountId: '12345',
    containerId: '67890',
    dataLayerName: 'testDataLayer',
    measurementIdCustomJS: 'testMeasurementIdCustomJS',
  };

  it('should createMeasurementIdCJS function', () => {
    const result = createMeasurementIdCJS(
      mockData.accountId,
      mockData.containerId,
      mockData.measurementIdCustomJS
    );
    expect(result).toEqual({
      name: 'Custom JS - Measurement ID',
      type: 'jsm',
      accountId: mockData.accountId,
      containerId: mockData.containerId,
      parameter: [
        {
          type: 'TEMPLATE',
          key: 'javascript',
          value: mockData.measurementIdCustomJS,
        },
      ],
      formatValue: {},
    });
  });

  it('should createVariable function', () => {
    const result = createVariable(
      mockData.accountId,
      mockData.containerId,
      mockData.dataLayerName
    );
    expect(result).toEqual({
      name: `DLV - ${mockData.dataLayerName}`,
      type: 'v',
      accountId: mockData.accountId,
      containerId: mockData.containerId,
      parameter: [
        {
          type: 'INTEGER',
          key: 'dataLayerVersion',
          value: '2',
        },
        {
          type: 'BOOLEAN',
          key: 'setDefaultValue',
          value: 'false',
        },
        {
          type: 'TEMPLATE',
          key: 'name',
          value: mockData.dataLayerName,
        },
      ],
    });
  });

  it('should getBuiltInVariables function', () => {
    // the result should be an array of objects, including the built-in variables
    // for now, we only have video and scroll built-in variables in use
    const result = getBuiltInVariables(
      mockData.accountId,
      mockData.containerId,
      []
    );
    expect(result).toEqual([
      {
        accountId: mockData.accountId,
        containerId: mockData.containerId,
        type: 'VIDEO_PROVIDER',
        name: 'Video Provider',
      },
      {
        accountId: mockData.accountId,
        containerId: mockData.containerId,
        type: 'VIDEO_URL',
        name: 'Video URL',
      },
      {
        accountId: mockData.accountId,
        containerId: mockData.containerId,
        type: 'VIDEO_TITLE',
        name: 'Video Title',
      },
      {
        accountId: mockData.accountId,
        containerId: mockData.containerId,
        type: 'VIDEO_DURATION',
        name: 'Video Duration',
      },
      {
        accountId: mockData.accountId,
        containerId: mockData.containerId,
        type: 'VIDEO_PERCENT',
        name: 'Video Percent',
      },
      {
        accountId: mockData.accountId,
        containerId: mockData.containerId,
        type: 'VIDEO_VISIBLE',
        name: 'Video Visible',
      },
      {
        accountId: mockData.accountId,
        containerId: mockData.containerId,
        type: 'VIDEO_STATUS',
        name: 'Video Status',
      },
      {
        accountId: mockData.accountId,
        containerId: mockData.containerId,
        type: 'VIDEO_CURRENT_TIME',
        name: 'Video Current Time',
      },
      {
        accountId: mockData.accountId,
        containerId: mockData.containerId,
        type: 'SCROLL_DEPTH_THRESHOLD',
        name: 'Scroll Depth Threshold',
      },
    ]);
  });

  it('should getVariables function', () => {
    const result = getVariables(
      mockData.accountId,
      mockData.containerId,
      [],
      mockData.measurementIdCustomJS
    );
    expect(result).toEqual([
      {
        name: 'Custom JS - Measurement ID',
        accountId: '12345',
        containerId: '67890',
        formatValue: {},
        parameter: [
          {
            key: 'javascript',
            type: 'TEMPLATE',
            value: 'testMeasurementIdCustomJS',
          },
        ],
        type: 'jsm',
        variableId: '1',
      },
    ]);
  });
});
