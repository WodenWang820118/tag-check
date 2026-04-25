'use strict';

import { glob } from 'glob';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

async function getLcovFiles() {
  try {
    const includeE2eCoverage = process.env.INCLUDE_E2E_COVERAGE === '1';
    const ignore = [
      'coverage/lcov.info',
      'node_modules/**',
      ...(includeE2eCoverage ? [] : ['coverage/apps/nest-backend-e2e/**'])
    ];
    const files = await glob('coverage/**/lcov.info', {
      ignore
    });
    files.sort();
    console.log('Include e2e coverage:', includeE2eCoverage);
    console.log('Files found:', files);
    return files;
  } catch (error) {
    console.error('Error in glob:', error);
    return [];
  }
}

(async function () {
  try {
    console.log('Script started');
    const files = await getLcovFiles();
    console.log('Number of files found:', files.length);

    if (files.length === 0) {
      console.log('No lcov.info files found. Exiting.');
      return;
    }

    const mergedReport = files.reduce((mergedReport, currFile) => {
      console.log('Reading file:', currFile);
      const content = readFileSync(currFile, 'utf8');
      console.log('File content length:', content.length);
      return mergedReport + content;
    }, '');

    const outputDir = resolve('./coverage');
    const outputPath = resolve(outputDir, 'lcov.info');
    mkdirSync(outputDir, { recursive: true });
    console.log('Writing merged report to:', outputPath);
    console.log('Merged report length:', mergedReport.length);

    writeFileSync(outputPath, mergedReport, 'utf8');
  } catch (error) {
    console.error('An error occurred:', error);
  }
})();

console.log('Script execution initiated');
