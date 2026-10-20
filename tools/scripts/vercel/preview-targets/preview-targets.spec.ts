import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { workspaceRoot } from '../../tauri/path-contract/path-contract.ts';
import {
  parseAffectedProjects,
  PREVIEW_TARGETS,
  selectPreviewTargets
} from './preview-targets.ts';

describe('parseAffectedProjects', () => {
  it('reads the JSON array nx prints', () => {
    expect(parseAffectedProjects('["ng-frontend","utils"]\n')).toEqual([
      'ng-frontend',
      'utils'
    ]);
  });

  it('skips plugin warnings printed before the array', () => {
    const output = [
      '@nx/playwright: could not infer an Nx task from the webServer command',
      '["ng-gtm-sample"]'
    ].join('\n');
    expect(parseAffectedProjects(output)).toEqual(['ng-gtm-sample']);
  });

  it('reads an empty list', () => {
    expect(parseAffectedProjects('[]')).toEqual([]);
  });

  it('rejects output without a project list', () => {
    expect(() =>
      parseAffectedProjects('NX   Failed to process project graph')
    ).toThrow(/JSON array/);
    expect(() => parseAffectedProjects('[1, 2]')).toThrow(
      /array of project names/
    );
  });
});

describe('selectPreviewTargets', () => {
  it('selects only the sites whose Nx project is affected', () => {
    expect(
      selectPreviewTargets(['nest-backend', 'ng-gtm-sample', 'utils']).map(
        (target) => target.vercelProject
      )
    ).toEqual(['tag-check-ng-gtm-sample']);
  });

  it('selects no site when only non-site projects are affected', () => {
    expect(selectPreviewTargets(['nest-backend', 'desktop-tauri'])).toEqual([]);
  });

  it('selects the Storybook site when ng-frontend is affected', () => {
    expect(
      selectPreviewTargets(['ng-frontend']).map(
        (target) => target.vercelProject
      )
    ).toEqual(['tag-check-storybook']);
  });
});

describe('PREVIEW_TARGETS', () => {
  const scripts: Record<string, string> = JSON.parse(
    readFileSync(join(workspaceRoot, 'package.json'), 'utf8')
  ).scripts;

  it.each(PREVIEW_TARGETS)(
    '$vercelProject builds $nxProject with the $buildScript script',
    ({ nxProject, buildScript }) => {
      expect(scripts[buildScript]).toMatch(new RegExp(`\\b${nxProject}\\b`));
    }
  );

  it('names each Vercel project once', () => {
    const names = PREVIEW_TARGETS.map((target) => target.vercelProject);
    expect(new Set(names).size).toBe(names.length);
  });
});
