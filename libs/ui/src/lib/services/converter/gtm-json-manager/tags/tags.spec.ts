jest.mock('../utilities/utilities', () => ({
  isIncludeVideo: jest.fn().mockReturnValue(true),
  isIncludeScroll: jest.fn().mockReturnValue(true),
  hasExistedDataLayer: jest.fn().mockReturnValue(false),
}));

import { Tag, TriggerConfig } from 'src/app/interfaces/gtm-config-generator';
import { createTag } from './event-tag';
import { createGA4Configuration } from './ga4-configuration-tag';
import { createScrollTag } from './scroll-tag';
import { getTags } from './tag-utilities';
import { createVideoTag } from './video-tag';

const mockTags: Tag[] = [
  {
    name: 'tag1',
    triggers: [{ name: 'trigger1', triggerId: '1' }],
    parameters: [{ key: 'key1', value: 'value1', type: 'template' }],
  },
];

const mockDataLayers = ['ecommerce', 'ecommerce.items'];

const mockTriggers: TriggerConfig[] = [
  {
    name: 'event youtube video',
    type: 'PAGEVIEW',
    accountId: '1',
    containerId: '1',
    triggerId: '1',
    firingTriggerId: ['1'],
    fingerprint: '1',
    customEventFilter: [
      {
        type: 'INCLUDE',
        parameter: [
          {
            type: 'TEMPLATE',
            key: 'key1',
            value: 'value1',
          },
        ],
      },
    ],
  },
  {
    name: 'event scroll',
    type: 'PAGEVIEW',
    accountId: '1',
    containerId: '1',
    triggerId: '2',
    firingTriggerId: ['2'],
    fingerprint: '2',
    customEventFilter: [
      {
        type: 'INCLUDE',
        parameter: [
          {
            type: 'TEMPLATE',
            key: 'key2',
            value: 'value2',
          },
        ],
      },
    ],
  },
];

const mockData = {
  accountId: '1',
  containerId: '1',
  dataLayers: mockDataLayers,
  triggers: mockTriggers,
  tags: mockTags,
  data: [
    {
      key: 'begin_checkout',
      value: 'begin_checkout',
      type: 'template',
    },
  ],
};

describe('Tag-related Helper Functions', () => {
  // Reset all mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should createGA4Configuration function', () => {
    const result = createGA4Configuration(
      mockData.accountId,
      mockData.containerId
    );
    // Test structure and some of the properties
    expect(result).toHaveProperty('name', 'GA4 Configuration');
    expect(result).toHaveProperty('type', 'gaawc');
  });

  it('should createTag function', () => {
    const result = createTag(
      mockData.accountId,
      mockData.containerId,
      mockData.tags[0],
      mockData.dataLayers,
      mockData.triggers
    );

    expect(result).toHaveProperty('name', 'GA4 event - tag1');
    expect(result).toHaveProperty('type', 'gaawe');
    expect(result).toHaveProperty('accountId', '1');
    expect(result).toHaveProperty('containerId', '1');
    expect(result).toHaveProperty('parameter');
  });

  it('should createVideoTag function', () => {
    // one of the triggers has the name 'event youtube video'
    const result = createVideoTag(
      mockData.accountId,
      mockData.containerId,
      mockData.data,
      mockData.triggers
    )[0];

    expect(result).toHaveProperty('containerId', '1');
    expect(result).toHaveProperty('accountId', '1');
    expect(result).toHaveProperty('type', 'gaawe');
    expect(result).toHaveProperty('name', 'GA4 Event - Video');
    expect(result).toHaveProperty('parameter');
  });

  it('should createScrollTag function', () => {
    // one of the triggers has the name 'event scroll'
    const result = createScrollTag(
      mockData.accountId,
      mockData.containerId,
      mockData.data,
      mockData.triggers
    )[0];

    expect(result).toHaveProperty('containerId', '1');
    expect(result).toHaveProperty('accountId', '1');
    expect(result).toHaveProperty('type', 'gaawe');
    expect(result).toHaveProperty('name', 'GA4 - scroll');
    expect(result).toHaveProperty('parameter');
  });

  it('should getTags function', () => {
    const result = getTags(
      mockData.accountId,
      mockData.containerId,
      mockData.data,
      mockData.triggers,
      mockData.tags,
      mockData.dataLayers
    );

    // the result should be an array of tags in order; otherwise, the test will fail
    // i.e. the first tag should be the GA4 configuration tag
    // the second tag should be general tags
    // the third tag should be the video tag
    // the fourth tag should be the scroll tag
    expect(result).toEqual(
      [
        createGA4Configuration(mockData.accountId, mockData.containerId),
        ...mockData.tags.map((tag) =>
          createTag(
            mockData.accountId,
            mockData.containerId,
            tag,
            mockData.dataLayers,
            mockData.triggers
          )
        ),
        ...createVideoTag(
          mockData.accountId,
          mockData.containerId,
          mockData.data,
          mockData.triggers
        ),
        ...createScrollTag(
          mockData.accountId,
          mockData.containerId,
          mockData.data,
          mockData.triggers
        ),
      ].map((tag, index) => ({
        ...tag,
        tagId: (index + 1).toString(),
      }))
    );
  });
});
