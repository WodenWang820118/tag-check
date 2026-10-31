import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import { DataSource } from 'typeorm';
import { DATABASE_ENTITIES } from '../../../../core/database/database-entities';
import { DATABASE_MIGRATIONS } from '../../../../core/database/database-migrations';
import { ConfigsService } from '../../../../core/configs/configs.service';
import { TestEventRepositoryService } from '../../../../core/repository/test-event/test-event-repository.service';
import { ProjectEntity, TestEventEntity } from '../../../../shared';
import { FileService } from '../../../../infrastructure/os/file/file.service';
import { FilePathService } from '../../../../infrastructure/os/path/file-path/file-path.service';
import { ClickHandler } from './click-handler.service';
import { ChangeHandler } from './change-handler.service';
import { ClickStrategyService } from '../strategies/click-strategies/click-strategy.service';
import { PageClickService } from '../strategies/click-strategies/page-click.service';
import { EvaluateClickService } from '../strategies/click-strategies/evaluate-click.service';
import { ChangeStrategyService } from '../strategies/change-strategies/change-strategy.service';
import { PageChangeService } from '../strategies/change-strategies/page-change.service';
import { EvaluateChangeService } from '../strategies/change-strategies/evaluate-change.service';
import { ActionUtilsService } from '../action-utils/action-utils.service';
import { StepExecutorService } from '../step-executor/step-executor.service';
import { StepExecutorUtilsService } from '../step-executor/step-executor-utils.service';
import { DataLayerService } from '../web-monitoring/data-layer/data-layer.service';
import type { Step } from '@utils';

const chromeAvailable = await puppeteer
  .executablePath()
  .then(existsSync, () => false);

/**
 * The host is large and the button sits in its corner, so a click that only
 * resolves `my-widget` hits the host and never the button.
 */
const shadowPage = `<!doctype html><title>Shadow</title>
<style>
my-widget{display:block;position:relative;width:300px;height:300px}
</style>
<my-widget></my-widget>
<script>
window.bought = 0;
customElements.define('my-widget', class extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const button = document.createElement('button');
    button.className = 'buy';
    button.setAttribute('aria-label', 'Buy the item');
    button.textContent = 'Buy';
    button.style.position = 'absolute';
    button.style.left = '0';
    button.style.top = '0';
    button.style.width = '20px';
    button.style.height = '20px';
    button.addEventListener('click', () => { window.bought += 1; });
    root.appendChild(button);
  }
});
</script>`;

const framedPage = `<!doctype html><title>Framed</title>
<iframe src="/inner"></iframe>`;

const innerPage = `<!doctype html><title>Inner</title>
<button id="inside">Inside</button>
<input id="field">
<script>
document.querySelector('#inside').addEventListener('click', () => {
  document.body.dataset.clicked = 'yes';
});
</script>`;

const startPage = `<!doctype html><title>Start</title>
<a id="go" href="/landed">Go</a>`;

const landedPage = `<!doctype html><title>Landed</title>
<button id="only-here">Only here</button>
<script>
window.found = 0;
document.querySelector('#only-here').addEventListener('click', () => {
  window.found += 1;
});
</script>`;

/** Slow enough that a click returns while the new document is still loading. */
const LANDED_DELAY_MS = 400;

function documentFor(
  path: string
): { body: string; delayMs?: number } | undefined {
  switch (path) {
    case '/shadow':
      return { body: shadowPage };
    case '/framed':
      return { body: framedPage };
    case '/inner':
      return { body: innerPage };
    case '/start':
      return { body: startPage };
    case '/landed':
      return { body: landedPage, delayMs: LANDED_DELAY_MS };
    default:
      return undefined;
  }
}

describe.skipIf(!chromeAvailable)(
  'Chrome Recorder chains, frames and asserted navigations',
  () => {
    let browser: Browser;
    let server: Server;
    let origin: string;
    let database: DataSource;
    let clicks: ClickHandler;
    let changes: ChangeHandler;
    let executor: StepExecutorService;

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
      await database.getRepository(TestEventEntity).save({
        project,
        eventId: 'event',
        testName: 'Replay',
        eventName: 'select_content',
        stopNavigation: false
      });
      const events = new TestEventRepositoryService(
        database.getRepository(TestEventEntity)
      );
      server = createServer((request, response) => {
        const path = request.url?.split('?')[0] ?? '/';
        const document = documentFor(path);
        if (!document) {
          response.writeHead(404).end();
          return;
        }
        const send = () => {
          response
            .writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
            .end(document.body);
        };
        if (document.delayMs === undefined) {
          send();
          return;
        }
        setTimeout(send, document.delayMs);
      });
      await new Promise<void>((resolve) =>
        server.listen(0, '127.0.0.1', resolve)
      );
      const address = server.address();
      if (!address || typeof address === 'string') {
        throw new Error('Expected the fixture server to listen on a TCP port');
      }
      origin = 'http://127.0.0.1:' + address.port;
      const actions = new ActionUtilsService();
      const dataLayer = {
        updateSelfDataLayer: async () => undefined
      } as unknown as DataLayerService;
      clicks = new ClickHandler(
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
      changes = new ChangeHandler(
        new ChangeStrategyService(
          new PageChangeService(),
          new EvaluateChangeService(actions)
        ),
        actions
      );
      executor = new StepExecutorService(
        { click: clicks, change: changes },
        dataLayer,
        new StepExecutorUtilsService(dataLayer, {
          getUSER_AGENT: () => 'TagCheck'
        } as unknown as ConfigsService),
        events
      );
      browser = await puppeteer.launch({
        headless: true,
        args: process.platform === 'linux' ? ['--no-sandbox'] : []
      });
    }, 60000);

    afterAll(async () => {
      await browser?.close();
      server?.closeAllConnections();
      if (server) {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
      if (database?.isInitialized) await database.destroy();
    }, 60000);

    async function open(path: string): Promise<Page> {
      const page = await browser.newPage();
      await page.goto(origin + path);
      return page;
    }

    it('clicks a button through a two-part shadow chain', async () => {
      const page = await open('/shadow');
      try {
        const step: Step = {
          type: 'click',
          selectors: [['my-widget', 'button.buy']]
        };
        await clicks.handle(page, 'demo', 'event', step, false);
        expect(await page.evaluate('window.bought')).toBe(1);
      } finally {
        await page.close();
      }
    });

    it('clicks a button through a shadow chain with an aria part', async () => {
      const page = await open('/shadow');
      try {
        const step: Step = {
          type: 'click',
          selectors: [['my-widget', 'aria/Buy the item']]
        };
        await clicks.handle(page, 'demo', 'event', step, false);
        expect(await page.evaluate('window.bought')).toBe(1);
      } finally {
        await page.close();
      }
    });

    it('clicks and types inside an iframe', async () => {
      const page = await open('/framed');
      try {
        await clicks.handle(
          page,
          'demo',
          'event',
          { type: 'click', selectors: [['#inside']], frame: [0] },
          false
        );
        const frame = page.mainFrame().childFrames()[0];
        if (!frame) {
          throw new Error('Expected the iframe to be the first child frame');
        }
        expect(await frame.evaluate('document.body.dataset.clicked')).toBe(
          'yes'
        );
        await changes.handle(
          page,
          'demo',
          'event',
          {
            type: 'change',
            selectors: [['#field']],
            frame: [0],
            value: 'inside'
          },
          false
        );
        expect(
          await frame.evaluate('document.querySelector("#field").value')
        ).toBe('inside');
      } finally {
        await page.close();
      }
    });

    it('finds a selector that exists only on the page a click navigates to', async () => {
      const page = await open('/start');
      try {
        expect(await page.$('#only-here')).toBeNull();
        const step: Step = {
          type: 'click',
          selectors: [['#go']],
          assertedEvents: [{ type: 'navigation', url: origin + '/landed' }]
        };
        await executor.handleDefaultAction(
          page,
          step,
          'demo',
          'event',
          false,
          0,
          false
        );
        expect(page.url()).toBe(origin + '/landed');
        await clicks.handle(
          page,
          'demo',
          'event',
          { type: 'click', selectors: [['#only-here']], timeout: 3000 },
          false
        );
        expect(await page.evaluate('window.found')).toBe(1);
      } finally {
        await page.close();
      }
    });
  }
);
