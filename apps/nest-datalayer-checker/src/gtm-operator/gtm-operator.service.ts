import { Injectable } from '@nestjs/common';
import { Page } from 'puppeteer';
import { chunk } from '../utilities/utilities';
import { WebAgentService } from '../web-agent/web-agent.service';

/**
 * A service for interacting with Google Tag Manager (GTM) via Puppeteer.
 */
@Injectable()
export class GtmOperatorService {
  constructor(private webAgentService: WebAgentService) {}

  /**
   * Goes to a GTM URL and returns the browser and page instances.
   * @param gtmUrl The URL of the GTM interface.
   * @param args Optional command-line arguments to pass to the browser instance.
   * @param headless Optional boolean flag indicating whether to run the browser in headless mode.
   * @returns An object containing the browser and page instances.
   */
  async goToPageViaGtm(gtmUrl: string, args?: string, headless?: string) {
    // 1) Open the GTM interface
    const websiteUrl = gtmUrl
      .split('&')
      .find(element => element.startsWith('url='))
      .split('=')[1];

    // TODO: use web-agent service
    // const browser = await this.puppeteerService.initAndReturnBrowser({
    //   headless: headless.toLowerCase() === 'true' ? true : false || false,
    //   args: args.split(','),
    // });
    const browser = await this.webAgentService.getCurrentBrowser(
      args,
      headless,
    );
    const page = await this.webAgentService.getGtmTestingPage(gtmUrl, browser);

    // 2) Do not include the debug mode
    await page.$('#include-debug-param').then(el => el?.click());

    // 3) Start tag manager preview mode
    await page.$('#domain-start-button').then(el => el?.click());

    // 4) Wait for the page to completely load
    await browser.waitForTarget(target => target.url() === websiteUrl);
    return { browser, page };
  }

  /**
   * Crawls the page responses for URLs containing the `gcs` parameter and returns them in an array.
   * @param page The page to crawl.
   * @returns An array of URLs containing the `gcs` parameter.
   */
  async crawlPageResponses(page: Page) {
    const responses: string[] = [];

    // 1) Listen to all responses, push the ones that contain the gcs parameter
    page.on('response', async response => {
      try {
        if (response.request().url().includes('gcs=')) {
          responses.push(response.request().url());
        }
      } catch (error) {
        console.log(error);
      }
    });

    await page.waitForResponse(response => response.url().includes('gcs='));
    return responses;
  }

  /**
   * Observes the Google Consent States (GCS) via GTM and returns them in an array.
   * @param gtmUrl The URL of the GTM interface.
   * @param args Optional command-line arguments to pass to the browser instance.
   * @param headless Optional boolean flag indicating whether to run the browser in headless mode.
   * @returns An object containing the browser instance and an array of GCS.
   */
  async observeGcsViaGtm(gtmUrl: string, args?: string, headless?: string) {
    const { browser, page } = await this.goToPageViaGtm(gtmUrl, args, headless);
    const pages = await browser.pages();
    const responses = await this.crawlPageResponses(pages[pages.length - 1]);
    const gcs = this.webAgentService.getGcs(responses);
    return { browser, gcs };
  }

  /**
   * Observes the Google Consent States (GCS) via GTM and keeps track of any anomalies in the GCS.
   * @param gtmUrl The URL of the GTM interface.
   * @param expectValue The value to expect in the GCS.
   * @param loops The number of loops to perform.
   * @param chunks The number of chunks to divide the loops into for parallel processing.
   * @param args Optional command-line arguments to pass to the browser instance.
   * @param headless Optional boolean flag indicating whether to run the browser in headless mode.
   * @returns An array of reports for any GCS anomalies detected.
   */
  async observeAndKeepGcsAnomaliesViaGtm(
    gtmUrl: string,
    expectValue: string,
    loops: number,
    chunkSize: number,
    args?: string,
    headless?: string,
  ) {
    const report = [];
    let anomalyCount = 0;
    const loopArray = Array.from(Array(loops).keys());
    const chunkedLoops = chunk(loopArray, chunkSize);

    for (let i = 0; i < chunkedLoops.length; i++) {
      const chunkReport = await Promise.all(
        chunkedLoops[i].map(async index => {
          try {
            const { browser, gcs } = await this.observeGcsViaGtm(
              gtmUrl,
              args,
              headless,
            );
            if (!gcs.includes(expectValue)) {
              console.log(
                'GCS anomaly detected! ' +
                  'Batch: ' +
                  (i + 1) +
                  ' with instances ' +
                  index,
              );
              console.log(gcs);
              anomalyCount++;
              await browser.close();
              return {
                anomalyCount: anomalyCount,
                gcs: gcs,
                date: new Date(),
              };
            } else {
              console.log(
                'GCS anomaly not detected! ' +
                  'Batch: ' +
                  (i + 1) +
                  ' with instances ' +
                  index,
              );
              await browser.close();
              return {
                anomalyCount: anomalyCount,
                gcs: gcs,
                date: new Date(),
              };
            }
          } catch (error) {
            console.log(error);
          }
        }),
      );
      report.push(...chunkReport);
    }
    return report;
  }
}
