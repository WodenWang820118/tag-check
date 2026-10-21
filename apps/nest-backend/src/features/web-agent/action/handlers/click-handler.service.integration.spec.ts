import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import puppeteer, { type Browser } from 'puppeteer';
import { DataSource } from 'typeorm';
import { DATABASE_ENTITIES } from '../../../../core/database/database-entities';
import { DATABASE_MIGRATIONS } from '../../../../core/database/database-migrations';
import { TestEventRepositoryService } from '../../../../core/repository/test-event/test-event-repository.service';
import { ProjectEntity, TestEventEntity } from '../../../../shared';
import { FileService } from '../../../../infrastructure/os/file/file.service';
import { FilePathService } from '../../../../infrastructure/os/path/file-path/file-path.service';
import { ClickHandler } from './click-handler.service';
import { ClickStrategyService } from '../strategies/click-strategies/click-strategy.service';
import { PageClickService } from '../strategies/click-strategies/page-click.service';
import { EvaluateClickService } from '../strategies/click-strategies/evaluate-click.service';
import { ActionUtilsService } from '../action-utils/action-utils.service';
import type { Step } from '@utils';

const chromeAvailable = (() => {
  try {
    return existsSync(puppeteer.executablePath());
  } catch {
    return false;
  }
})();

const fixture = `<!doctype html><title>Bookmark fixture</title>
<a id="next" href="/next"><span>Next page</span></a>
<form action="/submitted"><button id="submit">Submit form</button></form>
<script>
window.dataLayer = [];
document.addEventListener('click', () => {
  dataLayer.push({ event: 'select_content' });
  navigator.sendBeacon('/g/collect?v=2&tid=G-TEST&en=select_content', '');
});
</script>`;

describe.skipIf(!chromeAvailable)(
  'saved navigation bookmarks in Chromium',
  () => {
    let browser: Browser;
    let server: Server;
    let origin: string;
    let database: DataSource;
    let events: TestEventRepositoryService;
    let handler: ClickHandler;

    beforeAll(async () => {
      database = await new DataSource({
        type: 'sqlite',
        database: ':memory:',
        entities: DATABASE_ENTITIES,
        migrations: DATABASE_MIGRATIONS
      }).initialize();
      await database.runMigrations();
      const project = await database.getRepository(ProjectEntity).save({
        projectSlug: 'demo',
        projectName: 'Demo'
      });
      const other = await database.getRepository(ProjectEntity).save({
        projectSlug: 'other',
        projectName: 'Other'
      });
      await database.getRepository(TestEventEntity).save([
        {
          project,
          eventId: 'event',
          testName: 'Click',
          eventName: 'select_content',
          stopNavigation: false
        },
        {
          project: other,
          eventId: 'event',
          testName: 'Other click',
          eventName: 'select_content',
          stopNavigation: false
        }
      ]);
      events = new TestEventRepositoryService(
        database.getRepository(TestEventEntity)
      );
      server = createServer((request, response) => {
        if (request.url?.startsWith('/g/collect')) {
          request.resume();
          response.writeHead(204).end();
        } else {
          response.writeHead(200, { 'content-type': 'text/html' }).end(fixture);
        }
      });
      await new Promise<void>((resolve) =>
        server.listen(0, '127.0.0.1', resolve)
      );
      origin = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
      const actions = new ActionUtilsService();
      handler = new ClickHandler(
        events,
        {
          readJsonFile: () => ({
            steps: [{ type: 'setViewport' }, { type: 'navigate', url: origin }]
          })
        } as unknown as FileService,
        {
          getOperationFilePath: async () => 'fixture.json'
        } as unknown as FilePathService,
        new ClickStrategyService(
          new PageClickService(),
          new EvaluateClickService(actions)
        ),
        actions
      );
      browser = await puppeteer.launch({
        headless: true,
        args: process.platform === 'linux' ? ['--no-sandbox'] : []
      });
    }, 60000);

    afterAll(async () => {
      await browser?.close();
      server?.closeAllConnections();
      if (server)
        await new Promise<void>((resolve) => server.close(() => resolve()));
      if (database?.isInitialized) await database.destroy();
    }, 60000);

    it.each([
      ['CSS descendant', '#next span', false],
      ['text selector', 'text/Next page', false],
      ['XPath selector', 'xpath///*[@id="next"]', false],
      ['offset click', '#next', true],
      ['form submit', '#submit', false]
    ] as const)(
      'prevents the saved final %s navigation while delivering click analytics',
      async (_name, selector, offset) => {
        const saved = await events.updateTestEvents('demo', [
          { eventId: 'event', stopNavigation: true }
        ]);
        expect(saved[0].stopNavigation).toBe(true);
        expect(
          (await events.getEntityBySlugAndEventId('other', 'event'))
            .stopNavigation
        ).toBe(false);
        const page = await browser.newPage();
        try {
          await page.goto(origin);
          const step: Step = {
            type: 'click',
            selectors: [[selector]],
            ...(offset ? { offsetX: 5, offsetY: 5 } : {})
          };
          const request = page.waitForRequest((request) =>
            request.url().includes('/g/collect')
          );
          await handler.handle(page, 'demo', 'event', step, true);
          await request;
          expect(page.url()).toBe(origin + '/');
          expect(await page.evaluate('window.dataLayer')).toEqual([
            { event: 'select_content' }
          ]);
          expect(
            await page.evaluate(
              'Object.keys(window).filter(key => key.startsWith("__tagCheckNavigation_"))'
            )
          ).toEqual([]);
          // A subsequent manual click navigates: the guard never leaks past replay.
          await Promise.all([page.waitForNavigation(), page.click('#next')]);
          expect(page.url()).toBe(origin + '/next');
        } finally {
          await page.close();
        }
      }
    );

    it.each([
      [false, true, 'disabled bookmark'],
      [true, false, 'intermediate journey click']
    ] as const)(
      'allows navigation for %s/%s (%s)',
      async (stopNavigation, last) => {
        await events.updateTestEvents('demo', [
          { eventId: 'event', stopNavigation }
        ]);
        const page = await browser.newPage();
        try {
          await page.goto(origin);
          await Promise.all([
            page.waitForNavigation(),
            handler.handle(
              page,
              'demo',
              'event',
              { type: 'click', selectors: [['#next']] },
              last
            )
          ]);
          expect(page.url()).toBe(origin + '/next');
        } finally {
          await page.close();
        }
      }
    );
  }
);
