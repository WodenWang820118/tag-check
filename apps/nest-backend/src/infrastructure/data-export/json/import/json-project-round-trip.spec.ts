import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ProjectEntity,
  TestEventEntity,
  SpecEntity,
  RecordingEntity,
  ItemDefEntity,
  TestEventDetailEntity,
  TestImageEntity,
  AuthenticationSettingEntity,
  BrowserSettingEntity,
  ApplicationSettingEntity,
  SysConfigurationEntity
} from '../../../../shared';
import { JsonImportCoreModule } from '../core/json-import-core.module';
import { ImportTransactionService } from '../core/import-transaction.service';
import { JsonProjectExportService } from '../export/json-project-export.service';
import { FixtureEnvelopeV1 } from '../../interfaces/fixture-types';

const entities = [
  ProjectEntity,
  TestEventEntity,
  SpecEntity,
  RecordingEntity,
  ItemDefEntity,
  TestEventDetailEntity,
  TestImageEntity,
  AuthenticationSettingEntity,
  BrowserSettingEntity,
  ApplicationSettingEntity,
  SysConfigurationEntity
];

/** A test, its pointers and the tests' project, as stored. */
type StoredTest = {
  id: number;
  projectSlug: string | null;
  eventId: string;
  latestRunId: number | null;
  latestScreenshotId: number | null;
};

describe('JSON project export and import of a project with runs', () => {
  let moduleRef: TestingModule;
  let ds: DataSource;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities,
          synchronize: true
        }),
        JsonImportCoreModule
      ],
      providers: [JsonProjectExportService]
    }).compile();
    ds = moduleRef.get(DataSource);
    await seedProjectWithRun('a', 'event-a');
    await seedProjectWithRun('b', 'event-b');
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  async function seedProjectWithRun(slug: string, eventId: string) {
    const project = await ds
      .getRepository(ProjectEntity)
      .save({ projectSlug: slug, projectName: slug });
    const test = await ds.getRepository(TestEventEntity).save({
      project,
      eventId,
      testName: `${slug} test`,
      eventName: 'add_to_cart',
      message: ''
    });
    const screenshot = await ds.getRepository(TestImageEntity).save({
      testEvent: test,
      imageName: `${slug}.png`,
      imageData: Buffer.from(slug)
    });
    const run = await ds.getRepository(TestEventDetailEntity).save({
      testEvent: test,
      passed: true,
      requestPassed: true,
      destinationUrl: `https://${slug}.example`,
      testImage: screenshot
    });
    await ds.getRepository(TestEventEntity).update(test.id, {
      latestTestEventDetailId: run.id,
      latestTestImageId: screenshot.id
    });
  }

  async function exportProject(slug: string): Promise<FixtureEnvelopeV1> {
    return (await moduleRef
      .get(JsonProjectExportService)
      .exportProject(slug)) as unknown as FixtureEnvelopeV1;
  }

  async function importEnvelope(env: FixtureEnvelopeV1) {
    return await moduleRef
      .get(ImportTransactionService)
      .runWithinTransaction(env);
  }

  async function storedTests(): Promise<StoredTest[]> {
    const rows: Array<{
      id: number;
      project_slug: string | null;
      event_id: string;
      latest_test_event_detail_id: number | null;
      latest_test_image_id: number | null;
    }> = await ds.query(
      `SELECT t.id, p.project_slug, t.event_id,
              t.latest_test_event_detail_id, t.latest_test_image_id
         FROM test_event t LEFT JOIN project p ON p.id = t.project_id
        ORDER BY t.id`
    );
    return rows.map((row) => ({
      id: row.id,
      projectSlug: row.project_slug,
      eventId: row.event_id,
      latestRunId: row.latest_test_event_detail_id,
      latestScreenshotId: row.latest_test_image_id
    }));
  }

  /** The runs and screenshots of one test, by its id. */
  async function rowsOfTest(testId: number) {
    const runs = await ds.getRepository(TestEventDetailEntity).find({
      relations: { testImage: true },
      where: { testEvent: { id: testId } }
    });
    const screenshots = await ds
      .getRepository(TestImageEntity)
      .find({ where: { testEvent: { id: testId } } });
    return { runs, screenshots };
  }

  it('imports the tests, runs and screenshots under a new slug, pointing at their own rows', async () => {
    const env = await exportProject('b');
    const copy = JSON.parse(
      JSON.stringify(env).replaceAll('"b"', '"c"')
    ) as FixtureEnvelopeV1;

    await importEnvelope(copy);

    const tests = await storedTests();
    const imported = tests.find((test) => test.projectSlug === 'c');
    expect(imported).toBeDefined();
    if (!imported) return;
    const { runs, screenshots } = await rowsOfTest(imported.id);
    expect(runs).toHaveLength(1);
    expect(screenshots).toHaveLength(1);
    expect(runs[0].destinationUrl).toBe('https://b.example');
    expect(runs[0].testImage?.id).toBe(screenshots[0].id);
    expect(imported.latestRunId).toBe(runs[0].id);
    expect(imported.latestScreenshotId).toBe(screenshots[0].id);
    // The source project keeps its own rows.
    const source = tests.find((test) => test.projectSlug === 'b');
    expect(source).toMatchObject({ latestRunId: 2, latestScreenshotId: 2 });
    expect((await rowsOfTest(2)).runs).toHaveLength(1);
  });

  it('imports into a database where the exported ids do not exist', async () => {
    const env = await exportProject('b');
    for (const sql of [
      'UPDATE test_event SET latest_test_event_detail_id = NULL, latest_test_image_id = NULL',
      'DELETE FROM test_event_detail',
      'DELETE FROM test_image',
      'DELETE FROM test_event',
      'DELETE FROM project'
    ]) {
      await ds.query(sql);
    }

    const { stats } = await importEnvelope(env);

    expect(stats['TestEventEntity']).toEqual({ inserted: 1, skipped: 0 });
    const [imported] = await storedTests();
    expect(imported.projectSlug).toBe('b');
    const { runs, screenshots } = await rowsOfTest(imported.id);
    expect(imported.latestRunId).toBe(runs[0].id);
    expect(imported.latestScreenshotId).toBe(screenshots[0].id);
  });

  it('re-importing a project over itself leaves its tests and runs as they were', async () => {
    const before = await storedTests();

    await importEnvelope(await exportProject('b'));

    expect(await storedTests()).toEqual(before);
    expect(await ds.getRepository(TestEventDetailEntity).count()).toBe(2);
  });
});
