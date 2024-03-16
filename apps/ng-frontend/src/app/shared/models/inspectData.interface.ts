export interface IInspectEvent {
  application: {
    localStorage: {
      data: any[];
    };
    cookie: {
      data: any[];
    };
  }; // Existing application data
  puppeteerArgs: string[]; // An array of strings for Puppeteer arguments
}
