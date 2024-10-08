import { getJestProjects } from '@nx/jest';

export default {
  projects: [...getJestProjects(), 'libs/data-access/jest.config.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
};
