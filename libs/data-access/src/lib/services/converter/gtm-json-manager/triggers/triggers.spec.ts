import { createTrigger } from './event-trigger';
import { createScrollTrigger, scrollTriggers } from './scroll-trigger';
import { getTriggers } from './trigger-utilities';
import { videoTrigger } from './video-trigger';

jest.mock('../utilities/utilities', () => ({
  isIncludeVideo: jest.fn().mockReturnValue(true),
  isIncludeScroll: jest.fn().mockReturnValue(true),
  hasExistedDataLayer: jest.fn().mockReturnValue(false),
}));

jest.mock('../constant', () => ({
  scrollTriggers: jest.fn(),
  videoTrigger: jest.fn(),
}));

describe('Helper Functions', () => {
  const MOCK_ACCOUNT_ID = '1';
  const MOCK_CONTAINER_ID = '1';
  const MOCK_TRIGGER = 'mockTrigger';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTrigger', () => {
    it('should return correct TriggerConfig', () => {
      const result = createTrigger(
        MOCK_ACCOUNT_ID,
        MOCK_CONTAINER_ID,
        MOCK_TRIGGER
      );
      expect(result).toEqual({
        accountId: MOCK_ACCOUNT_ID,
        containerId: MOCK_CONTAINER_ID,
        type: 'CUSTOM_EVENT',
        name: `event equals ${MOCK_TRIGGER}`,
        customEventFilter: [
          {
            type: 'EQUALS',
            parameter: [
              {
                type: 'TEMPLATE',
                key: 'arg0',
                value: '{{_event}}',
              },
              {
                type: 'TEMPLATE',
                key: 'arg1',
                value: MOCK_TRIGGER,
              },
            ],
          },
        ],
      });
    });
  });

  describe('createVideoTrigger', () => {
    it('should return videoTrigger when isIncludeVideo is true', () => {
      const result = createVideoTrigger(MOCK_ACCOUNT_ID, MOCK_CONTAINER_ID, []);
      expect(result).toEqual([
        videoTrigger({
          accountId: MOCK_ACCOUNT_ID,
          containerId: MOCK_CONTAINER_ID,
        }),
      ]);
    });

    it('should return empty array when isIncludeVideo is false', () => {
      const result = createVideoTrigger(MOCK_ACCOUNT_ID, MOCK_CONTAINER_ID, []);
      expect(result).toEqual([]);
    });
  });

  describe('createScrollTrigger', () => {
    it('should return scrollTriggers when isIncludeScroll is true', () => {
      const result = createScrollTrigger(
        MOCK_ACCOUNT_ID,
        MOCK_CONTAINER_ID,
        []
      );
      expect(result).toEqual([
        scrollTriggers({ accountId: '1', containerId: '1' }),
      ]);
    });

    it('should return empty array when isIncludeScroll is false', () => {
      const result = createScrollTrigger(
        MOCK_ACCOUNT_ID,
        MOCK_CONTAINER_ID,
        []
      );
      expect(result).toEqual([]);
    });

    it('should catch errors and return an empty array', () => {
      const result = createScrollTrigger(
        MOCK_ACCOUNT_ID,
        MOCK_CONTAINER_ID,
        []
      );
      expect(result).toEqual([]);
    });
  });

  describe('getTriggers', () => {
    it('should aggregate triggers correctly', () => {
      const mockTriggers = [
        { name: 'trigger1', triggerId: '1' },
        { name: 'trigger2', triggerId: '2' },
      ];
      const mockData: Record<string, string>[] = [];
      const result = getTriggers(
        MOCK_ACCOUNT_ID,
        MOCK_CONTAINER_ID,
        mockData,
        mockTriggers
      );
      expect(result).toEqual(
        [
          ...mockTriggers.map(({ name: trigger }) => {
            return createTrigger(MOCK_ACCOUNT_ID, MOCK_CONTAINER_ID, trigger);
          }),
          ...createVideoTrigger(MOCK_ACCOUNT_ID, MOCK_CONTAINER_ID, mockData),
          ...createScrollTrigger(MOCK_ACCOUNT_ID, MOCK_CONTAINER_ID, mockData),
        ].map((_trigger, index) => ({
          ..._trigger,
          triggerId: (index + 1).toString(),
        }))
      );
    });
  });
});
function createVideoTrigger(
  MOCK_ACCOUNT_ID: string,
  MOCK_CONTAINER_ID: string,
  arg2: never[]
) {
  throw new Error('Function not implemented.');
}
