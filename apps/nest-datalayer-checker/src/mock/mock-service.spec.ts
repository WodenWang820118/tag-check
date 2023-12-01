export const mockPage = {
  authenticate: jest.fn(),
  waitForFunction: jest.fn(),
  waitForNavigation: jest.fn(),
  url: jest.fn(),
  waitForRequest: jest.fn().mockImplementation((request: any) => {
    return {
      url: jest.fn().mockImplementation(() => {
        return 'url';
      }),
    };
  }),
  setRequestInterception: jest.fn(),
  evaluate: jest.fn(),
  close: jest.fn(),
  on: jest.fn(),
};
